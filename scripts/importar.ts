// Importador por lotes de los datos ya recolectados.
//
//   npm run importar -- data/mis_piezas.csv [--fotos ./carpeta_fotos] [--dry-run] [--crear-catalogos]
//
// - Cada fila se valida con las MISMAS reglas que el formulario web.
// - Todas las fichas importadas quedan en BORRADOR (para publicar hacen falta fotos
//   y revisión; se publican desde el panel).
// - Un código ya existente se omite (nunca se sobrescribe ni se duplica).
// - Fotografías y modelo se leen de la carpeta indicada con --fotos y se validan
//   por su contenido, igual que en la carga web.
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { parseCsv } from "@/lib/csv";
import { registrarFoto, registrarModelo } from "@/lib/media";
import {
  erroresPorCampo,
  limpiarSegunCategoria,
  modeloSchema,
  normalizar,
  piezaSchema,
} from "@/lib/validation";

const COLUMNAS_PIEZA = Object.keys(piezaSchema.shape).filter(
  (k) => k !== "materialId" && k !== "tipologiaId",
);
const COLUMNAS_ESPECIALES = ["material", "tipologia", "fotos", "modelo", "unidad", "escalaValidada"];

function argumentos() {
  const args = process.argv.slice(2);
  const opciones = { archivo: "", carpetaFotos: "", dryRun: false, crearCatalogos: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--dry-run") opciones.dryRun = true;
    else if (a === "--crear-catalogos") opciones.crearCatalogos = true;
    else if (a === "--fotos") opciones.carpetaFotos = args[++i] ?? "";
    else if (!a.startsWith("--") && !opciones.archivo) opciones.archivo = a;
    else {
      console.error(`Argumento no reconocido: ${a}`);
      process.exit(1);
    }
  }
  if (!opciones.archivo) {
    console.error(
      "Uso: npm run importar -- <archivo.csv> [--fotos <carpeta>] [--dry-run] [--crear-catalogos]",
    );
    process.exit(1);
  }
  return opciones;
}

async function leerArchivoSeguro(carpeta: string, nombre: string): Promise<Buffer> {
  const raiz = path.resolve(carpeta);
  const abs = path.resolve(raiz, nombre);
  if (!abs.startsWith(raiz + path.sep)) throw new Error(`Ruta fuera de la carpeta de fotos: ${nombre}`);
  return fs.readFile(abs);
}

async function main() {
  const opt = argumentos();
  const texto = await fs.readFile(opt.archivo, "utf8");
  const { cabeceras, filas } = parseCsv(texto);

  if (!cabeceras.includes("codigo") || !cabeceras.includes("nombre")) {
    console.error('El CSV debe tener al menos las columnas "codigo" y "nombre".');
    process.exit(1);
  }
  const desconocidas = cabeceras.filter(
    (c) => !COLUMNAS_PIEZA.includes(c) && !COLUMNAS_ESPECIALES.includes(c),
  );
  if (desconocidas.length) console.warn(`Aviso: columnas ignoradas: ${desconocidas.join(", ")}`);

  const materiales = new Map((await prisma.material.findMany()).map((m) => [normalizar(m.nombre), m.id]));
  const tipologias = new Map((await prisma.tipologia.findMany()).map((t) => [normalizar(t.nombre), t.id]));

  let creadas = 0;
  let omitidas = 0;
  let conError = 0;
  const avisos: string[] = [];

  async function resolverCatalogo(
    tipo: "material" | "tipologia",
    nombre: string,
    mapa: Map<string, number>,
  ): Promise<number | null> {
    const clave = normalizar(nombre);
    if (!clave) return null;
    const existente = mapa.get(clave);
    if (existente) return existente;
    if (!opt.crearCatalogos) return null;
    if (opt.dryRun) return 1; // marcador: en simulación no se crea nada
    const limpio = nombre.trim().replace(/\s+/g, " ");
    const creado =
      tipo === "material"
        ? await prisma.material.create({ data: { nombre: limpio } })
        : await prisma.tipologia.create({ data: { nombre: limpio } });
    mapa.set(clave, creado.id);
    return creado.id;
  }

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const linea = i + 2; // +1 cabecera, +1 base 1
    const etiqueta = `Fila ${linea} (${fila.codigo || "sin código"})`;

    const materialId = await resolverCatalogo("material", fila.material ?? "", materiales);
    const tipologiaId = await resolverCatalogo("tipologia", fila.tipologia ?? "", tipologias);
    const problemas: string[] = [];
    if (!materialId) {
      problemas.push(`material «${fila.material ?? ""}» no existe en el catálogo (use --crear-catalogos o créelo en /admin/catalogos)`);
    }
    if (!tipologiaId) {
      problemas.push(`tipología «${fila.tipologia ?? ""}» no existe en el catálogo (use --crear-catalogos o créela en /admin/catalogos)`);
    }

    const crudo: Record<string, unknown> = {};
    for (const col of COLUMNAS_PIEZA) if (col in fila) crudo[col] = fila[col];
    crudo.materialId = materialId ?? 0;
    crudo.tipologiaId = tipologiaId ?? 0;

    const parsed = piezaSchema.safeParse(crudo);
    if (!parsed.success) {
      const errores = erroresPorCampo(parsed.error);
      for (const [campo, msg] of Object.entries(errores)) {
        if ((campo === "materialId" || campo === "tipologiaId") && problemas.length) continue;
        problemas.push(`${campo}: ${msg}`);
      }
    }
    if (problemas.length || !parsed.success) {
      conError++;
      console.error(`✗ ${etiqueta}: ${problemas.join("; ")}`);
      continue;
    }

    const datos = limpiarSegunCategoria(parsed.data);

    if (await prisma.pieza.findUnique({ where: { codigo: datos.codigo }, select: { id: true } })) {
      omitidas++;
      console.warn(`↷ ${etiqueta}: el código ya existe, se omite.`);
      continue;
    }

    // Metadatos del modelo (si la fila trae uno)
    const nombreModelo = fila.modelo?.trim();
    let metaModelo: { unidad: (typeof modeloSchema)["_output"]["unidad"]; escalaValidada: number | null } | null = null;
    if (nombreModelo) {
      const m = modeloSchema.safeParse({
        unidad: fila.unidad?.trim() || "unidades del modelo",
        escalaValidada: fila.escalaValidada ?? "",
      });
      if (!m.success) {
        conError++;
        console.error(`✗ ${etiqueta}: modelo: ${Object.values(erroresPorCampo(m.error)).join("; ")}`);
        continue;
      }
      metaModelo = m.data;
    }

    if (opt.dryRun) {
      creadas++;
      console.log(`✓ ${etiqueta}: válida (simulación, no se guardó).`);
      continue;
    }

    const pieza = await prisma.pieza.create({ data: { ...datos, estado: "BORRADOR" } });
    creadas++;

    const nombresFotos = (fila.fotos ?? "").split("|").map((s) => s.trim()).filter(Boolean);
    const hayMedia = nombresFotos.length > 0 || !!nombreModelo;
    if (hayMedia && !opt.carpetaFotos) {
      avisos.push(`${etiqueta}: la fila indica archivos pero no se pasó --fotos; se omitieron.`);
    } else {
      for (const nombre of nombresFotos) {
        try {
          const r = await registrarFoto(pieza.id, nombre, await leerArchivoSeguro(opt.carpetaFotos, nombre));
          if (!r.ok) avisos.push(`${etiqueta}: ${r.error}`);
        } catch (e) {
          avisos.push(`${etiqueta}: no se pudo leer la foto «${nombre}» (${(e as Error).message}).`);
        }
      }
      if (nombreModelo && metaModelo) {
        try {
          const r = await registrarModelo(
            pieza.id,
            nombreModelo,
            await leerArchivoSeguro(opt.carpetaFotos, nombreModelo),
            metaModelo.unidad,
            metaModelo.escalaValidada,
          );
          if (!r.ok) avisos.push(`${etiqueta}: ${r.error}`);
        } catch (e) {
          avisos.push(`${etiqueta}: no se pudo leer el modelo «${nombreModelo}» (${(e as Error).message}).`);
        }
      }
    }
    console.log(`✓ ${etiqueta}: importada como borrador.`);
  }

  console.log("\n--- Resumen ---");
  console.log(`${opt.dryRun ? "Válidas (simulación)" : "Importadas"}: ${creadas}`);
  console.log(`Omitidas por código repetido: ${omitidas}`);
  console.log(`Con errores: ${conError}`);
  if (avisos.length) {
    console.log("\nAvisos de archivos:");
    for (const a of avisos) console.log(` - ${a}`);
  }
  if (conError > 0) process.exitCode = 2;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

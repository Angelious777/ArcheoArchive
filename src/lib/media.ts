// Registro de fotografías y modelos 3D: valida el contenido, guarda el archivo
// y crea la referencia en la base de datos. Lo usan las acciones del panel y el
// importador, para que ambas rutas apliquen exactamente las mismas reglas.
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  MAX_IMAGEN_BYTES,
  MAX_MODELO_BYTES,
  detectarArchivo,
  formatoBytes,
} from "@/lib/files";
import { eliminar, eliminarCarpeta, guardar } from "@/lib/storage";

export type ResultadoMedia = { ok: true } | { ok: false; error: string };

export async function registrarFoto(
  piezaId: string,
  nombreOriginal: string,
  datos: Buffer,
  descripcion: string | null = null,
): Promise<ResultadoMedia> {
  if (datos.length === 0) return { ok: false, error: `${nombreOriginal}: el archivo está vacío.` };
  if (datos.length > MAX_IMAGEN_BYTES) {
    return {
      ok: false,
      error: `${nombreOriginal}: supera el máximo de ${formatoBytes(MAX_IMAGEN_BYTES)}.`,
    };
  }
  const det = detectarArchivo(datos);
  if (!det || det.tipo !== "imagen") {
    return { ok: false, error: `${nombreOriginal}: formato no admitido (solo JPEG, PNG o WebP).` };
  }

  const key = `piezas/${piezaId}/fotos/${randomUUID()}.${det.ext}`;
  await guardar(key, datos);
  try {
    const orden = await prisma.fotografia.count({ where: { piezaId } });
    await prisma.fotografia.create({
      data: { piezaId, archivoKey: key, mime: det.mime, descripcion, orden },
    });
    return { ok: true };
  } catch (e) {
    await eliminar(key); // no dejar archivo huérfano si falla la base de datos
    console.error("registrarFoto", e);
    return { ok: false, error: `${nombreOriginal}: no se pudo registrar en la base de datos.` };
  }
}

export async function registrarModelo(
  piezaId: string,
  nombreOriginal: string,
  datos: Buffer,
  unidad: string,
  escalaValidada: number | null,
): Promise<ResultadoMedia> {
  const existente = await prisma.modelo3D.findUnique({ where: { piezaId } });
  if (existente) {
    return {
      ok: false,
      error: "La pieza ya tiene un modelo 3D. Elimínelo antes de subir otro.",
    };
  }
  if (datos.length === 0) return { ok: false, error: `${nombreOriginal}: el archivo está vacío.` };
  if (datos.length > MAX_MODELO_BYTES) {
    return {
      ok: false,
      error: `${nombreOriginal}: supera el máximo de ${formatoBytes(MAX_MODELO_BYTES)}.`,
    };
  }
  const det = detectarArchivo(datos);
  if (!det || det.tipo !== "modelo") {
    return { ok: false, error: `${nombreOriginal}: formato no admitido (solo archivos GLB).` };
  }

  const key = `piezas/${piezaId}/modelo/${randomUUID()}.${det.ext}`;
  await guardar(key, datos);
  try {
    await prisma.modelo3D.create({
      data: { piezaId, archivoKey: key, formato: det.formato, unidad, escalaValidada },
    });
    return { ok: true };
  } catch (e) {
    await eliminar(key);
    console.error("registrarModelo", e);
    return { ok: false, error: `${nombreOriginal}: no se pudo registrar en la base de datos.` };
  }
}

/**
 * Elimina una pieza y TODOS sus archivos (RD-15, CP-12).
 * Las filas de Fotografia y Modelo3D desaparecen por cascada en la base de datos;
 * después se borra la carpeta completa de la pieza en el almacenamiento.
 */
export async function eliminarPiezaCompleta(piezaId: string): Promise<void> {
  await prisma.pieza.delete({ where: { id: piezaId } });
  await eliminarCarpeta(`piezas/${piezaId}`);
}

"use server";
// Todas las operaciones administrativas. Regla de oro: la PRIMERA línea de cada
// acción es `await requireAdmin()`; nada se ejecuta sin sesión de administrador
// (CP-04), aunque alguien invoque la acción con una petición directa.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { faltantesParaPublicar } from "@/lib/publicacion";
import {
  erroresPorCampo,
  limpiarSegunCategoria,
  modeloSchema,
  piezaSchema,
} from "@/lib/validation";
import { eliminar } from "@/lib/storage";
import { eliminarPiezaCompleta, registrarFoto, registrarModelo } from "@/lib/media";
import type { EstadoAccion } from "@/lib/tipos";

function esErrorPrisma(e: unknown, codigo: string): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === codigo;
}

function datosDeFormulario(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$ACTION")) obj[k] = v;
  }
  return obj;
}

/* ------------------------------------------------------------------ */
/* Piezas                                                              */
/* ------------------------------------------------------------------ */

export async function crearPieza(_prev: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  await requireAdmin();

  const parsed = piezaSchema.safeParse(datosDeFormulario(formData));
  if (!parsed.success) {
    return { error: "Revise los campos marcados.", errores: erroresPorCampo(parsed.error) };
  }
  const datos = limpiarSegunCategoria(parsed.data);

  let id: string;
  try {
    const creada = await prisma.pieza.create({ data: { ...datos, estado: "BORRADOR" } });
    id = creada.id;
  } catch (e) {
    if (esErrorPrisma(e, "P2002")) {
      return {
        error: "Revise los campos marcados.",
        errores: { codigo: "Ya existe una pieza con ese código de inventario." },
      };
    }
    if (esErrorPrisma(e, "P2003")) {
      return { error: "El material o la tipología seleccionados ya no existen." };
    }
    console.error("crearPieza", e);
    return { error: "No se pudo guardar la ficha. Intente de nuevo." };
  }

  revalidatePath("/admin");
  redirect(`/admin/piezas/${id}?creada=1`);
}

export async function actualizarPieza(
  id: string,
  _prev: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requireAdmin();

  const parsed = piezaSchema.safeParse(datosDeFormulario(formData));
  if (!parsed.success) {
    return { error: "Revise los campos marcados.", errores: erroresPorCampo(parsed.error) };
  }
  const datos = limpiarSegunCategoria(parsed.data);

  try {
    await prisma.pieza.update({ where: { id }, data: datos });
  } catch (e) {
    if (esErrorPrisma(e, "P2002")) {
      return {
        error: "Revise los campos marcados.",
        errores: { codigo: "Ya existe otra pieza con ese código de inventario." },
      };
    }
    if (esErrorPrisma(e, "P2025")) return { error: "La pieza ya no existe." };
    console.error("actualizarPieza", e);
    return { error: "No se pudo guardar los cambios. Intente de nuevo." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/piezas/${id}`);
  return { ok: true, mensaje: "Cambios guardados." };
}

export async function publicarPieza(id: string, _prev: EstadoAccion): Promise<EstadoAccion> {
  await requireAdmin();

  const pieza = await prisma.pieza.findUnique({
    where: { id },
    include: { _count: { select: { fotografias: true } } },
  });
  if (!pieza) return { error: "La pieza ya no existe." };

  const faltan = faltantesParaPublicar(pieza, pieza._count.fotografias);
  if (faltan.length > 0) {
    return { error: "No se puede publicar todavía.", detalles: faltan };
  }

  await prisma.pieza.update({ where: { id }, data: { estado: "PUBLICADO" } });
  revalidatePath("/admin");
  revalidatePath(`/admin/piezas/${id}`);
  return { ok: true, mensaje: "La ficha quedó publicada." };
}

export async function despublicarPieza(id: string, _prev: EstadoAccion): Promise<EstadoAccion> {
  await requireAdmin();
  try {
    await prisma.pieza.update({ where: { id }, data: { estado: "BORRADOR" } });
  } catch (e) {
    if (esErrorPrisma(e, "P2025")) return { error: "La pieza ya no existe." };
    throw e;
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/piezas/${id}`);
  return { ok: true, mensaje: "La ficha volvió a borrador." };
}

export async function eliminarPieza(id: string, formData: FormData) {
  await requireAdmin();
  // La confirmación se pide en el cliente y se vuelve a exigir aquí.
  if (formData.get("confirmar") !== "si") return;
  try {
    await eliminarPiezaCompleta(id);
  } catch (e) {
    if (!esErrorPrisma(e, "P2025")) throw e; // si ya no existe, se continúa
  }
  revalidatePath("/admin");
  redirect("/admin?eliminada=1");
}

/* ------------------------------------------------------------------ */
/* Fotografías                                                         */
/* ------------------------------------------------------------------ */

export async function subirFotos(
  piezaId: string,
  _prev: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requireAdmin();

  const pieza = await prisma.pieza.findUnique({ where: { id: piezaId }, select: { id: true } });
  if (!pieza) return { error: "La pieza ya no existe." };

  const archivos = formData
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (archivos.length === 0) return { error: "Seleccione al menos una fotografía." };
  if (archivos.length > 20) return { error: "Máximo 20 fotografías por carga." };

  const descripcion = String(formData.get("descripcion") ?? "").trim().slice(0, 300) || null;

  let subidas = 0;
  const detalles: string[] = [];
  for (const archivo of archivos) {
    const r = await registrarFoto(piezaId, archivo.name, Buffer.from(await archivo.arrayBuffer()), descripcion);
    if (r.ok) subidas++;
    else detalles.push(r.error);
  }

  revalidatePath(`/admin/piezas/${piezaId}`);
  revalidatePath("/admin");
  if (subidas === 0) return { error: "No se subió ninguna fotografía.", detalles };
  return {
    ok: true,
    mensaje: `${subidas} fotografía(s) subida(s).`,
    detalles: detalles.length ? detalles : undefined,
  };
}

export async function actualizarDescripcionFoto(
  fotoId: string,
  _prev: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requireAdmin();
  const descripcion = String(formData.get("descripcion") ?? "").trim().slice(0, 300) || null;
  try {
    const f = await prisma.fotografia.update({ where: { id: fotoId }, data: { descripcion } });
    revalidatePath(`/admin/piezas/${f.piezaId}`);
  } catch (e) {
    if (esErrorPrisma(e, "P2025")) return { error: "La fotografía ya no existe." };
    throw e;
  }
  return { ok: true, mensaje: "Descripción guardada." };
}

export async function eliminarFoto(
  fotoId: string,
  _prev: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requireAdmin();
  if (formData.get("confirmar") !== "si") return { error: "Falta la confirmación." };

  const foto = await prisma.fotografia.findUnique({
    where: { id: fotoId },
    include: { pieza: { select: { id: true, estado: true, _count: { select: { fotografias: true } } } } },
  });
  if (!foto) return { error: "La fotografía ya no existe." };

  if (foto.pieza.estado === "PUBLICADO" && foto.pieza._count.fotografias <= 1) {
    return {
      error: "Es la única fotografía de una ficha publicada. Pase la ficha a borrador antes de eliminarla.",
    };
  }

  await prisma.fotografia.delete({ where: { id: fotoId } });
  await eliminar(foto.archivoKey); // sin archivos huérfanos
  revalidatePath(`/admin/piezas/${foto.pieza.id}`);
  revalidatePath("/admin");
  return { ok: true, mensaje: "Fotografía eliminada." };
}

/* ------------------------------------------------------------------ */
/* Modelo 3D                                                           */
/* ------------------------------------------------------------------ */

export async function subirModelo(
  piezaId: string,
  _prev: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requireAdmin();

  const pieza = await prisma.pieza.findUnique({ where: { id: piezaId }, select: { id: true } });
  if (!pieza) return { error: "La pieza ya no existe." };

  const meta = modeloSchema.safeParse(datosDeFormulario(formData));
  if (!meta.success) return { error: "Revise los campos.", errores: erroresPorCampo(meta.error) };

  const archivo = formData.get("modelo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Seleccione un archivo GLB." };
  }

  const r = await registrarModelo(
    piezaId,
    archivo.name,
    Buffer.from(await archivo.arrayBuffer()),
    meta.data.unidad,
    meta.data.escalaValidada,
  );
  revalidatePath(`/admin/piezas/${piezaId}`);
  revalidatePath("/admin");
  if (!r.ok) return { error: r.error };
  return { ok: true, mensaje: "Modelo 3D asociado." };
}

export async function actualizarModelo(
  piezaId: string,
  _prev: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requireAdmin();
  const meta = modeloSchema.safeParse(datosDeFormulario(formData));
  if (!meta.success) return { error: "Revise los campos.", errores: erroresPorCampo(meta.error) };
  try {
    await prisma.modelo3D.update({
      where: { piezaId },
      data: { unidad: meta.data.unidad, escalaValidada: meta.data.escalaValidada },
    });
  } catch (e) {
    if (esErrorPrisma(e, "P2025")) return { error: "La pieza no tiene modelo 3D." };
    throw e;
  }
  revalidatePath(`/admin/piezas/${piezaId}`);
  return { ok: true, mensaje: "Unidad y escala guardadas." };
}

export async function eliminarModelo(
  piezaId: string,
  _prev: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requireAdmin();
  if (formData.get("confirmar") !== "si") return { error: "Falta la confirmación." };

  const modelo = await prisma.modelo3D.findUnique({ where: { piezaId } });
  if (!modelo) return { error: "La pieza no tiene modelo 3D." };

  await prisma.modelo3D.delete({ where: { piezaId } });
  await eliminar(modelo.archivoKey);
  revalidatePath(`/admin/piezas/${piezaId}`);
  revalidatePath("/admin");
  return { ok: true, mensaje: "Modelo 3D eliminado." };
}

/* ------------------------------------------------------------------ */
/* Catálogos controlados: materiales y tipologías                      */
/* ------------------------------------------------------------------ */

type TipoCatalogo = "material" | "tipologia";

function nombreCatalogo(formData: FormData): string | null {
  const n = String(formData.get("nombre") ?? "").trim().replace(/\s+/g, " ");
  return n.length >= 2 && n.length <= 80 ? n : null;
}

export async function crearCatalogo(
  tipo: TipoCatalogo,
  _prev: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requireAdmin();
  const nombre = nombreCatalogo(formData);
  if (!nombre) return { error: "El nombre debe tener entre 2 y 80 caracteres." };
  try {
    if (tipo === "material") await prisma.material.create({ data: { nombre } });
    else await prisma.tipologia.create({ data: { nombre } });
  } catch (e) {
    if (esErrorPrisma(e, "P2002")) return { error: `«${nombre}» ya existe.` };
    throw e;
  }
  revalidatePath("/admin/catalogos");
  return { ok: true, mensaje: `«${nombre}» agregado.` };
}

export async function renombrarCatalogo(
  tipo: TipoCatalogo,
  id: number,
  _prev: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requireAdmin();
  const nombre = nombreCatalogo(formData);
  if (!nombre) return { error: "El nombre debe tener entre 2 y 80 caracteres." };
  try {
    if (tipo === "material") await prisma.material.update({ where: { id }, data: { nombre } });
    else await prisma.tipologia.update({ where: { id }, data: { nombre } });
  } catch (e) {
    if (esErrorPrisma(e, "P2002")) return { error: `«${nombre}» ya existe.` };
    if (esErrorPrisma(e, "P2025")) return { error: "El valor ya no existe." };
    throw e;
  }
  revalidatePath("/admin/catalogos");
  return { ok: true, mensaje: "Nombre actualizado." };
}

/** RD-04: no se elimina un material o tipología en uso (también lo garantiza la FK con Restrict). */
export async function eliminarCatalogo(
  tipo: TipoCatalogo,
  id: number,
  _prev: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requireAdmin();
  if (formData.get("confirmar") !== "si") return { error: "Falta la confirmación." };

  const enUso =
    tipo === "material"
      ? await prisma.pieza.count({ where: { materialId: id } })
      : await prisma.pieza.count({ where: { tipologiaId: id } });
  if (enUso > 0) {
    return { error: `No se puede eliminar: está en uso en ${enUso} pieza(s).` };
  }

  try {
    if (tipo === "material") await prisma.material.delete({ where: { id } });
    else await prisma.tipologia.delete({ where: { id } });
  } catch (e) {
    if (esErrorPrisma(e, "P2003")) return { error: "No se puede eliminar: está en uso." };
    if (esErrorPrisma(e, "P2025")) return { error: "El valor ya no existe." };
    throw e;
  }
  revalidatePath("/admin/catalogos");
  return { ok: true, mensaje: "Valor eliminado." };
}

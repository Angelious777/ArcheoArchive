import { EstadoPublicacion, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const piezaPublica = {
  id: true,
  codigo: true,
  nombre: true,
  descripcion: true,
  periodo: true,
  estiloCultural: true,
  procedencia: true,
  estadoConservacion: true,
  categoria: true,
  material: { select: { id: true, nombre: true } },
  tipologia: { select: { id: true, nombre: true } },
  fotografias: {
    orderBy: [{ orden: "asc" as const }, { creadoEn: "asc" as const }],
    select: { id: true, descripcion: true },
  },
  modelo3d: {
    select: { id: true, formato: true, unidad: true, escalaValidada: true },
  },
} satisfies Prisma.PiezaSelect;

export type FiltrosCatalogo = {
  busqueda?: string;
  materialId?: number;
  tipologiaId?: number;
};

function wherePublico(filtros: FiltrosCatalogo): Prisma.PiezaWhereInput {
  const busqueda = filtros.busqueda?.trim();
  return {
    estado: EstadoPublicacion.PUBLICADO,
    ...(busqueda
      ? {
          OR: [
            { nombre: { contains: busqueda, mode: "insensitive" } },
            { codigo: { contains: busqueda, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filtros.materialId ? { materialId: filtros.materialId } : {}),
    ...(filtros.tipologiaId ? { tipologiaId: filtros.tipologiaId } : {}),
  };
}

export async function listarPiezasPublicas(filtros: FiltrosCatalogo = {}) {
  return prisma.pieza.findMany({
    where: wherePublico(filtros),
    orderBy: [{ nombre: "asc" }, { codigo: "asc" }],
    select: piezaPublica,
  });
}

export async function obtenerPiezaPublica(id: string) {
  return prisma.pieza.findFirst({
    where: { id, estado: EstadoPublicacion.PUBLICADO },
    select: piezaPublica,
  });
}

export async function listarFiltrosPublicos() {
  const [materiales, tipologias] = await Promise.all([
    prisma.material.findMany({
      where: { piezas: { some: { estado: EstadoPublicacion.PUBLICADO } } },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.tipologia.findMany({
      where: { piezas: { some: { estado: EstadoPublicacion.PUBLICADO } } },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
  ]);
  return { materiales, tipologias };
}

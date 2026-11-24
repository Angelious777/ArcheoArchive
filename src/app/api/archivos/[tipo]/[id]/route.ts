// Entrega de fotografías y modelos desde el almacenamiento.
//  - Piezas PUBLICADAS: archivos públicos.
//  - Piezas en BORRADOR: solo para el administrador autenticado (un borrador
//    no debe filtrarse por conocer la URL del archivo).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { esAdmin } from "@/lib/auth";
import { existe, flujo, tamano } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tipo: string; id: string }> },
) {
  const { tipo, id } = await params;

  let registro: { archivoKey: string; mime: string; estado: string } | null = null;

  if (tipo === "foto") {
    const f = await prisma.fotografia.findUnique({
      where: { id },
      select: { archivoKey: true, mime: true, pieza: { select: { estado: true } } },
    });
    if (f) registro = { archivoKey: f.archivoKey, mime: f.mime, estado: f.pieza.estado };
  } else if (tipo === "modelo") {
    const m = await prisma.modelo3D.findUnique({
      where: { id },
      select: { archivoKey: true, pieza: { select: { estado: true } } },
    });
    if (m) registro = { archivoKey: m.archivoKey, mime: "model/gltf-binary", estado: m.pieza.estado };
  }

  if (!registro) return new NextResponse("No encontrado", { status: 404 });

  const publicado = registro.estado === "PUBLICADO";
  if (!publicado && !(await esAdmin())) {
    // Misma respuesta que un archivo inexistente: no revela que el borrador existe.
    return new NextResponse("No encontrado", { status: 404 });
  }
  if (!(await existe(registro.archivoKey))) {
    return new NextResponse("Archivo no disponible", { status: 404 });
  }

  return new Response(flujo(registro.archivoKey), {
    headers: {
      "Content-Type": registro.mime,
      "Content-Length": String(await tamano(registro.archivoKey)),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": publicado ? "public, max-age=3600" : "private, no-store",
    },
  });
}

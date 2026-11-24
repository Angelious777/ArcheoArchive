import { NextResponse } from "next/server";
import { obtenerPiezaPublica } from "@/lib/catalogo-publico";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const pieza = await obtenerPiezaPublica((await params).id);
  return pieza
    ? NextResponse.json({ pieza })
    : NextResponse.json({ error: "Pieza no encontrada" }, { status: 404 });
}

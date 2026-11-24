import { NextResponse } from "next/server";
import { listarFiltrosPublicos, listarPiezasPublicas } from "@/lib/catalogo-publico";

export const dynamic = "force-dynamic";

function entero(valor: string | null): number | undefined {
  if (!valor) return undefined;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : undefined;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const [piezas, filtros] = await Promise.all([
    listarPiezasPublicas({
      busqueda: url.searchParams.get("q") ?? undefined,
      materialId: entero(url.searchParams.get("material")),
      tipologiaId: entero(url.searchParams.get("tipologia")),
    }),
    listarFiltrosPublicos(),
  ]);
  return NextResponse.json({ piezas, filtros });
}

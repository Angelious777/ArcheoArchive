import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Piezas · ArcheoArchive" };

const POR_PAGINA = 25;

type Busqueda = { q?: string; estado?: string; pagina?: string; eliminada?: string };

export default async function PanelPiezas({ searchParams }: { searchParams: Promise<Busqueda> }) {
  await requireAdmin();
  const sp = await searchParams;

  const q = (sp.q ?? "").trim();
  const estado = sp.estado === "BORRADOR" || sp.estado === "PUBLICADO" ? sp.estado : undefined;
  const pagina = Math.max(1, Number.parseInt(sp.pagina ?? "1", 10) || 1);

  const where: Prisma.PiezaWhereInput = {
    ...(estado ? { estado } : {}),
    ...(q
      ? {
          OR: [
            { codigo: { contains: q, mode: "insensitive" } },
            { nombre: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [piezas, total, borradores, publicadas] = await Promise.all([
    prisma.pieza.findMany({
      where,
      orderBy: { creadoEn: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      include: {
        material: true,
        tipologia: true,
        modelo3d: { select: { id: true } },
        _count: { select: { fotografias: true } },
      },
    }),
    prisma.pieza.count({ where }),
    prisma.pieza.count({ where: { estado: "BORRADOR" } }),
    prisma.pieza.count({ where: { estado: "PUBLICADO" } }),
  ]);

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const enlace = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (estado) params.set("estado", estado);
    params.set("pagina", String(p));
    return `/admin?${params.toString()}`;
  };

  return (
    <>
      <h1>Piezas</h1>
      {sp.eliminada && <div className="mensaje ok ui">La pieza y sus archivos fueron eliminados.</div>}
      <p className="ui">
        {borradores} en borrador · {publicadas} publicadas ·{" "}
        <Link href="/admin/piezas/nueva">Registrar nueva pieza</Link>
      </p>

      <form className="filtros ui" method="get">
        <div className="campo">
          <label htmlFor="q">Buscar por código o nombre</label>
          <input id="q" name="q" defaultValue={q} />
        </div>
        <div className="campo">
          <label htmlFor="estado">Estado</label>
          <select id="estado" name="estado" defaultValue={estado ?? ""}>
            <option value="">Todos</option>
            <option value="BORRADOR">Borrador</option>
            <option value="PUBLICADO">Publicado</option>
          </select>
        </div>
        <button type="submit">Filtrar</button>
      </form>

      {piezas.length === 0 ? (
        <p className="vacio">No hay piezas que coincidan.</p>
      ) : (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Material</th>
                <th>Tipología</th>
                <th>Fotos</th>
                <th>3D</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {piezas.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/piezas/${p.id}`}>{p.codigo}</Link>
                  </td>
                  <td>{p.nombre}</td>
                  <td>{p.material.nombre}</td>
                  <td>{p.tipologia.nombre}</td>
                  <td>{p._count.fotografias}</td>
                  <td>{p.modelo3d ? "Sí" : "—"}</td>
                  <td>
                    <span className={`insignia ${p.estado === "PUBLICADO" ? "publicado" : "borrador"}`}>
                      {p.estado === "PUBLICADO" ? "Publicado" : "Borrador"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paginas > 1 && (
        <p className="ui acciones" style={{ marginTop: "1rem" }}>
          {pagina > 1 && <Link href={enlace(pagina - 1)}>← Anterior</Link>}
          <span>
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas && <Link href={enlace(pagina + 1)}>Siguiente →</Link>}
        </p>
      )}
    </>
  );
}

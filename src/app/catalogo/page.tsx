import Link from "next/link";
import { listarFiltrosPublicos, listarPiezasPublicas } from "@/lib/catalogo-publico";

export const dynamic = "force-dynamic";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; material?: string; tipologia?: string }>;
}) {
  const params = await searchParams;
  const materialId = params.material ? Number(params.material) : undefined;
  const tipologiaId = params.tipologia ? Number(params.tipologia) : undefined;
  const [piezas, filtros] = await Promise.all([
    listarPiezasPublicas({
      busqueda: params.q,
      materialId: Number.isInteger(materialId) ? materialId : undefined,
      tipologiaId: Number.isInteger(tipologiaId) ? tipologiaId : undefined,
    }),
    listarFiltrosPublicos(),
  ]);

  return (
    <>
      <header className="barra barra-publica ui"><div className="contenedor">
        <Link href="/" className="marca marca-publica">ArcheoArchive</Link>
        <nav aria-label="Navegación principal"><Link href="/catalogo">Catálogo</Link><Link className="nav-admin" href="/admin">Administración</Link></nav>
      </div></header>
      <main>
        <section className="catalogo-presentacion">
          <div className="contenedor">
            <p className="inicio-eyebrow">Colección arqueológica</p>
            <h1>Catálogo público</h1>
            <p>Consulta las piezas documentadas y explora sus registros materiales y culturales.</p>
          </div>
        </section>
        <div className="contenedor catalogo-contenido">
        <form className="filtros tarjeta ui" method="get">
          <div className="campo"><label htmlFor="q">Buscar por nombre o código</label>
            <input id="q" name="q" defaultValue={params.q} placeholder="Ej. AA-001 o vasija" /></div>
          <div className="campo"><label htmlFor="material">Material</label>
            <select id="material" name="material" defaultValue={params.material ?? ""}><option value="">Todos</option>
              {filtros.materiales.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></div>
          <div className="campo"><label htmlFor="tipologia">Tipología</label>
            <select id="tipologia" name="tipologia" defaultValue={params.tipologia ?? ""}><option value="">Todas</option>
              {filtros.tipologias.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></div>
          <button type="submit">Aplicar filtros</button>
        </form>
        {piezas.length === 0 ? <p className="tarjeta vacio">No encontramos piezas que coincidan con la búsqueda o los filtros. Prueba con otros criterios.</p> :
          <div className="catalogo-grid">{piezas.map((pieza) => {
            const foto = pieza.fotografias[0];
            return <Link className="pieza-card tarjeta ui" href={`/catalogo/${pieza.id}`} key={pieza.id}>
              {foto ? <img src={`/api/archivos/foto/${foto.id}`} alt={foto.descripcion ?? `Fotografía de ${pieza.nombre}`} /> :
                <div className="pieza-card-sin-foto">Sin fotografía</div>}
              <h2>{pieza.nombre}</h2><p className="codigo">{pieza.codigo}</p>
              <p>{pieza.material.nombre} · {pieza.tipologia.nombre}</p>
            </Link>;
          })}</div>}
        </div>
      </main>
    </>
  );
}

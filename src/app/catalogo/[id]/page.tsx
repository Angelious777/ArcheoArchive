import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerPiezaPublica } from "@/lib/catalogo-publico";
import { Visor3D } from "@/components/Visor3D";
import { GaleriaFotos } from "@/components/GaleriaFotos";

export const dynamic = "force-dynamic";

export default async function PiezaPublicaPage({ params }: { params: Promise<{ id: string }> }) {
  const pieza = await obtenerPiezaPublica((await params).id);
  if (!pieza) notFound();
  return <>
    <header className="barra ui"><div className="contenedor"><Link href="/catalogo" className="marca">ArcheoArchive · Catálogo</Link></div></header>
    <main className="contenedor">
      <Link href="/catalogo">← Volver al catálogo</Link>
      <article className="ficha-publica">
        <header className="ficha-encabezado">
          <p className="ficha-etiqueta">Ficha de catálogo</p>
          <h1>{pieza.nombre}</h1>
          <p className="codigo">Código de inventario · {pieza.codigo}</p>
        </header>
        <div className="ficha-introduccion">
          <div className="ficha-datos">
          <dl className="datos-ficha">
            <div><dt>Material</dt><dd>{pieza.material.nombre}</dd></div><div><dt>Tipología</dt><dd>{pieza.tipologia.nombre}</dd></div>
            {pieza.categoria && <div><dt>Categoría</dt><dd>{pieza.categoria}</dd></div>}
            {pieza.periodo && <div><dt>Período</dt><dd>{pieza.periodo}</dd></div>}
            {pieza.estiloCultural && <div><dt>Estilo cultural</dt><dd>{pieza.estiloCultural}</dd></div>}
            {pieza.procedencia && <div><dt>Procedencia</dt><dd>{pieza.procedencia}</dd></div>}
            {pieza.estadoConservacion && <div><dt>Estado de conservación</dt><dd>{pieza.estadoConservacion}</dd></div>}
          </dl>
          {pieza.descripcion && <section><h2>Descripción</h2><p>{pieza.descripcion}</p></section>}
          </div>
          <section className="ficha-galeria"><h2>Registro fotográfico</h2>
            <GaleriaFotos fotos={pieza.fotografias} nombre={pieza.nombre} />
          </section>
        </div>
        {pieza.modelo3d && <Visor3D src={`/api/archivos/modelo/${pieza.modelo3d.id}`} unidad={pieza.modelo3d.unidad} escalaValidada={pieza.modelo3d.escalaValidada} />}
      </article>
    </main>
  </>;
}

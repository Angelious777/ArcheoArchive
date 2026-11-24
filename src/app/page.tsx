import Link from "next/link";
import { listarFiltrosPublicos, listarPiezasPublicas } from "@/lib/catalogo-publico";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  const [piezas, filtros] = await Promise.all([
    listarPiezasPublicas(),
    listarFiltrosPublicos(),
  ]);
  const destacadas = piezas.slice(0, 6);

  return (
    <>
      <header className="barra barra-publica ui">
        <div className="contenedor">
          <Link href="/" className="marca marca-publica">ArcheoArchive</Link>
          <nav aria-label="Navegación principal">
            <Link href="/catalogo">Catálogo</Link>
            <Link className="nav-admin" href="/admin">Administración</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="inicio-hero">
          <div className="contenedor inicio-hero-contenido">
            <p className="inicio-eyebrow">Archivo arqueológico digital</p>
            <h1>Conservamos, documentamos y hacemos visible el patrimonio.</h1>
            <p className="inicio-introduccion">
              Explora una colección seleccionada de piezas arqueológicas, conoce su procedencia,
              su contexto cultural y observa los registros tridimensionales disponibles.
            </p>
            <div className="inicio-acciones">
              <Link className="boton" href="/catalogo">Explorar el catálogo</Link>
            </div>
          </div>
        </section>

        <section className="inicio-estadisticas" aria-label="Resumen de la colección">
          <div className="contenedor inicio-estadisticas-grid">
            <div><strong>{piezas.length}</strong><span>Piezas publicadas</span></div>
            <div><strong>{filtros.materiales.length}</strong><span>Materiales documentados</span></div>
            <div><strong>{filtros.tipologias.length}</strong><span>Tipologías registradas</span></div>
          </div>
        </section>

        <section className="contenedor inicio-coleccion" id="coleccion">
          <div className="inicio-seccion-titulo">
            <div>
              <p className="inicio-eyebrow">Catálogo disponible</p>
              <h2>Piezas de la colección</h2>
            </div>
            <Link className="inicio-ver-todo" href="/catalogo">Ver catálogo completo</Link>
          </div>

          {destacadas.length === 0 ? (
            <p className="tarjeta vacio">Aún no hay piezas publicadas en el catálogo.</p>
          ) : (
            <div className="catalogo-grid catalogo-grid-inicio">
              {destacadas.map((pieza) => {
                const foto = pieza.fotografias[0];
                return (
                  <Link className="pieza-card pieza-card-inicio" href={`/catalogo/${pieza.id}`} key={pieza.id}>
                    <div className="pieza-card-media">
                      {foto ? (
                        <img src={`/api/archivos/foto/${foto.id}`} alt={foto.descripcion ?? `Fotografía de ${pieza.nombre}`} />
                      ) : (
                        <div className="pieza-card-sin-foto">Sin fotografía</div>
                      )}
                    </div>
                    <div className="pieza-card-cuerpo">
                      <p className="codigo">{pieza.codigo}</p>
                      <h3>{pieza.nombre}</h3>
                      <p>{pieza.material.nombre} · {pieza.tipologia.nombre}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="pie-publico">
        <div className="contenedor">
          <p>ArcheoArchive</p>
          <span>Archivo digital de la colección arqueológica</span>
        </div>
      </footer>
    </>
  );
}

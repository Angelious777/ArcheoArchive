import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { crearCatalogo, eliminarCatalogo, renombrarCatalogo } from "../../actions";
import { CatalogoPanel } from "@/components/CatalogoPanel";

export const metadata = { title: "Catálogos · ArcheoArchive" };

export default async function Catalogos() {
  await requireAdmin();

  const [materiales, tipologias] = await Promise.all([
    prisma.material.findMany({ orderBy: { nombre: "asc" }, include: { _count: { select: { piezas: true } } } }),
    prisma.tipologia.findMany({ orderBy: { nombre: "asc" }, include: { _count: { select: { piezas: true } } } }),
  ]);

  return (
    <>
      <h1>Catálogos controlados</h1>
      <p className="ui">
        Material y tipología se eligen de estas listas al registrar una pieza. Un valor en uso no se
        puede eliminar.
      </p>
      <CatalogoPanel
        titulo="Materiales"
        items={materiales.map((m) => ({ id: m.id, nombre: m.nombre, enUso: m._count.piezas }))}
        crear={crearCatalogo.bind(null, "material")}
        renombrar={renombrarCatalogo.bind(null, "material")}
        eliminar={eliminarCatalogo.bind(null, "material")}
      />
      <CatalogoPanel
        titulo="Tipologías"
        items={tipologias.map((t) => ({ id: t.id, nombre: t.nombre, enUso: t._count.piezas }))}
        crear={crearCatalogo.bind(null, "tipologia")}
        renombrar={renombrarCatalogo.bind(null, "tipologia")}
        eliminar={eliminarCatalogo.bind(null, "tipologia")}
      />
    </>
  );
}

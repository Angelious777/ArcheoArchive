import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { aValoresFormulario } from "@/lib/format";
import {
  actualizarDescripcionFoto,
  actualizarModelo,
  actualizarPieza,
  despublicarPieza,
  eliminarFoto,
  eliminarModelo,
  eliminarPieza,
  publicarPieza,
  subirFotos,
  subirModelo,
} from "../../../actions";
import { PiezaForm } from "@/components/PiezaForm";
import { EstadoPanel } from "@/components/EstadoPanel";
import { FotosPanel, ModeloPanel } from "@/components/Multimedia";

export const metadata = { title: "Ficha · ArcheoArchive" };

export default async function FichaPieza({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ creada?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { creada } = await searchParams;

  const [pieza, materiales, tipologias] = await Promise.all([
    prisma.pieza.findUnique({
      where: { id },
      include: { fotografias: { orderBy: { orden: "asc" } }, modelo3d: true },
    }),
    prisma.material.findMany({ orderBy: { nombre: "asc" } }),
    prisma.tipologia.findMany({ orderBy: { nombre: "asc" } }),
  ]);
  if (!pieza) notFound();

  const { fotografias, modelo3d, ...datos } = pieza;

  return (
    <>
      <p className="ui">
        <Link href="/admin">← Volver al listado</Link>
      </p>
      <h1>
        {pieza.codigo} · {pieza.nombre}
      </h1>
      {creada && (
        <div className="mensaje ok ui">
          Ficha creada como borrador. Suba al menos una fotografía para poder publicarla.
        </div>
      )}

      <EstadoPanel
        estado={pieza.estado}
        publicar={publicarPieza.bind(null, id)}
        despublicar={despublicarPieza.bind(null, id)}
        eliminar={eliminarPieza.bind(null, id)}
      />

      <FotosPanel
        fotos={fotografias.map((f) => ({ id: f.id, descripcion: f.descripcion }))}
        subir={subirFotos.bind(null, id)}
        eliminar={eliminarFoto}
        describir={actualizarDescripcionFoto}
      />

      <ModeloPanel
        modelo={
          modelo3d
            ? {
                id: modelo3d.id,
                formato: modelo3d.formato,
                unidad: modelo3d.unidad,
                escalaValidada: modelo3d.escalaValidada,
              }
            : null
        }
        subir={subirModelo.bind(null, id)}
        actualizar={actualizarModelo.bind(null, id)}
        eliminar={eliminarModelo.bind(null, id)}
      />

      <h2 className="ui">Datos de la ficha</h2>
      <PiezaForm
        accion={actualizarPieza.bind(null, id)}
        materiales={materiales}
        tipologias={tipologias}
        valores={aValoresFormulario(datos)}
        textoBoton="Guardar cambios"
      />
    </>
  );
}

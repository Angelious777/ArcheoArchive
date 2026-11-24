import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { crearPieza } from "../../../actions";
import { PiezaForm } from "@/components/PiezaForm";
import Link from "next/link";

export const metadata = { title: "Nueva pieza · ArcheoArchive" };

export default async function NuevaPieza() {
  await requireAdmin();
  const [materiales, tipologias] = await Promise.all([
    prisma.material.findMany({ orderBy: { nombre: "asc" } }),
    prisma.tipologia.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <>
      <h1>Nueva pieza</h1>
      <p className="ui">
        La ficha se guarda como <strong>borrador</strong>. Después podrá subir fotografías y el modelo
        3D, y publicarla.
      </p>
      {(materiales.length === 0 || tipologias.length === 0) && (
        <div className="mensaje aviso">
          Primero defina al menos un material y una tipología en{" "}
          <Link href="/admin/catalogos">Catálogos</Link>.
        </div>
      )}
      <PiezaForm
        accion={crearPieza}
        materiales={materiales}
        tipologias={tipologias}
        textoBoton="Guardar como borrador"
      />
    </>
  );
}

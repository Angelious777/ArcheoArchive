import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Autorización en el servidor: sin sesión de administrador no se renderiza nada.
  const usuario = await requireAdmin();

  return (
    <>
      <header className="barra ui">
        <div className="contenedor">
          <Link href="/admin" className="marca">
            ArcheoArchive · Administración
          </Link>
          <nav>
            <Link href="/admin">Piezas</Link>
            <Link href="/admin/piezas/nueva">Nueva pieza</Link>
            <Link href="/admin/catalogos">Catálogos</Link>
            <span style={{ color: "var(--texto-suave)", fontSize: ".85rem" }}>{usuario.nombre}</span>
            <form action={logoutAction}>
              <button type="submit" className="secundario">
                Cerrar sesión
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="contenedor">{children}</main>
    </>
  );
}

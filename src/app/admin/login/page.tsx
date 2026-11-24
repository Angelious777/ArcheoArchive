import { redirect } from "next/navigation";
import { usuarioAdminActual } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Ingresar · ArcheoArchive" };

export default async function LoginPage() {
  if (await usuarioAdminActual()) redirect("/admin");
  return (
    <main className="contenedor" style={{ maxWidth: 420 }}>
      <h1>ArcheoArchive</h1>
      <p className="ui">Acceso de administración</p>
      <LoginForm />
    </main>
  );
}

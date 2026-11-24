// Autenticación y autorización EN EL SERVIDOR (Módulo 1).
// Regla: toda server action, página o ruta de API administrativa llama a
// `requireAdmin()` / `esAdmin()`. El middleware es una capa extra, no la única.
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  COOKIE_SESION,
  DURACION_SESION_S,
  firmarToken,
  verificarToken,
} from "@/lib/token";

const COSTE_BCRYPT = 12;

export async function hashPassword(plano: string): Promise<string> {
  return bcrypt.hash(plano, COSTE_BCRYPT);
}

// Hash de relleno para igualar el tiempo de respuesta cuando el correo no existe.
const HASH_RELLENO = bcrypt.hashSync("relleno-no-valido", COSTE_BCRYPT);

export async function verificarCredenciales(correo: string, password: string) {
  const usuario = await prisma.usuario.findUnique({ where: { correo: correo.toLowerCase() } });
  const ok = await bcrypt.compare(password, usuario?.passwordHash ?? HASH_RELLENO);
  if (!usuario || !ok) return null;
  return usuario;
}

export async function iniciarSesion(userId: string, rol: string) {
  const token = await firmarToken(userId, rol);
  const jar = await cookies();
  jar.set(COOKIE_SESION, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SESION_S,
  });
}

export async function cerrarSesion() {
  const jar = await cookies();
  jar.delete(COOKIE_SESION);
}

export type UsuarioSesion = { id: string; nombre: string; correo: string };

/**
 * Devuelve el administrador de la sesión actual, o null.
 * Además de validar la firma del token, consulta la base de datos: si el
 * usuario fue eliminado o degradado, la sesión deja de valer de inmediato.
 */
export async function usuarioAdminActual(): Promise<UsuarioSesion | null> {
  const jar = await cookies();
  const payload = await verificarToken(jar.get(COOKIE_SESION)?.value);
  if (!payload || payload.rol !== "ADMIN") return null;
  const u = await prisma.usuario.findUnique({
    where: { id: payload.sub },
    select: { id: true, nombre: true, correo: true, rol: true },
  });
  if (!u || u.rol !== "ADMIN") return null;
  return { id: u.id, nombre: u.nombre, correo: u.correo };
}

export async function esAdmin(): Promise<boolean> {
  return (await usuarioAdminActual()) !== null;
}

/** Úsese al inicio de toda página/acción administrativa. Sin sesión válida redirige al login. */
export async function requireAdmin(): Promise<UsuarioSesion> {
  const u = await usuarioAdminActual();
  if (!u) redirect("/admin/login");
  return u;
}

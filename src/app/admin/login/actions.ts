"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cerrarSesion, iniciarSesion, verificarCredenciales } from "@/lib/auth";
import { intentosAgotados, limpiarIntentos, registrarFallo } from "@/lib/ratelimit";
import type { EstadoAccion } from "@/lib/tipos";

const loginSchema = z.object({
  correo: z.string().trim().email("Ingrese un correo válido").max(200),
  password: z.string().min(1, "Ingrese su contraseña").max(200),
});

export async function loginAction(_prev: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const parsed = loginSchema.safeParse({
    correo: formData.get("correo"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const errores: Record<string, string> = {};
    for (const i of parsed.error.issues) errores[String(i.path[0])] ??= i.message;
    return { errores };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const clave = `${parsed.data.correo.toLowerCase()}|${ip}`;

  if (intentosAgotados(clave)) {
    return { error: "Demasiados intentos fallidos. Espere unos minutos e intente de nuevo." };
  }

  const usuario = await verificarCredenciales(parsed.data.correo, parsed.data.password);
  if (!usuario || usuario.rol !== "ADMIN") {
    registrarFallo(clave);
    return { error: "Credenciales incorrectas." };
  }

  limpiarIntentos(clave);
  await iniciarSesion(usuario.id, usuario.rol);
  redirect("/admin");
}

export async function logoutAction() {
  await cerrarSesion();
  redirect("/admin/login");
}

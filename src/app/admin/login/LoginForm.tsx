"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Mensajes } from "@/components/Mensajes";
import type { EstadoAccion } from "@/lib/tipos";

export function LoginForm() {
  const [estado, accion, pendiente] = useActionState<EstadoAccion, FormData>(loginAction, {});
  return (
    <form action={accion} className="tarjeta" noValidate>
      <Mensajes estado={estado} />
      <div className="campo" style={{ marginBottom: ".75rem" }}>
        <label htmlFor="correo">Correo</label>
        <input
          id="correo"
          name="correo"
          type="email"
          autoComplete="username"
          required
          aria-invalid={!!estado.errores?.correo}
        />
        {estado.errores?.correo && <span className="error-campo">{estado.errores.correo}</span>}
      </div>
      <div className="campo" style={{ marginBottom: "1rem" }}>
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={!!estado.errores?.password}
        />
        {estado.errores?.password && <span className="error-campo">{estado.errores.password}</span>}
      </div>
      <button type="submit" disabled={pendiente}>
        {pendiente ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}

// Firma y verificación del token de sesión (JWT HS256). Solo depende de `jose`,
// por lo que también se puede usar desde el middleware (Edge runtime).
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_SESION = "aa_session";
export const DURACION_SESION_S = 60 * 60 * 8; // 8 horas

function clave(): Uint8Array {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto || secreto.length < 32) {
    throw new Error("AUTH_SECRET no está definido o tiene menos de 32 caracteres.");
  }
  return new TextEncoder().encode(secreto);
}

export type PayloadSesion = { sub: string; rol: string };

export async function firmarToken(userId: string, rol: string): Promise<string> {
  return new SignJWT({ rol })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SESION_S}s`)
    .sign(clave());
}

export async function verificarToken(token: string | undefined): Promise<PayloadSesion | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, clave(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.rol !== "string") return null;
    return { sub: payload.sub, rol: payload.rol };
  } catch {
    return null;
  }
}

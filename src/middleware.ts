// Capa de defensa en profundidad: sin sesión válida, /admin/* redirige al login.
// La autorización real se vuelve a comprobar en cada acción/página del servidor.
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, verificarToken } from "@/lib/token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const payload = await verificarToken(req.cookies.get(COOKIE_SESION)?.value);
  if (!payload || payload.rol !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

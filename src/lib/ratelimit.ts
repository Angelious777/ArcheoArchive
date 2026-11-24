// Limitador simple de intentos de inicio de sesión (en memoria del proceso).
// Suficiente para una instancia única; con varias instancias habría que moverlo
// a la base de datos o a un servicio externo.
const VENTANA_MS = 15 * 60 * 1000;
const MAX_INTENTOS = 5;

const intentos = new Map<string, { n: number; desde: number }>();

export function intentosAgotados(clave: string): boolean {
  const r = intentos.get(clave);
  if (!r) return false;
  if (Date.now() - r.desde > VENTANA_MS) {
    intentos.delete(clave);
    return false;
  }
  return r.n >= MAX_INTENTOS;
}

export function registrarFallo(clave: string) {
  const ahora = Date.now();
  const r = intentos.get(clave);
  if (!r || ahora - r.desde > VENTANA_MS) intentos.set(clave, { n: 1, desde: ahora });
  else r.n += 1;
}

export function limpiarIntentos(clave: string) {
  intentos.delete(clave);
}

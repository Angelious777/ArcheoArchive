// Lector CSV mínimo y sin dependencias (comillas, saltos de línea dentro de
// campos, BOM, delimitador "," o ";" detectado automáticamente).

export type FilaCsv = Record<string, string>;

function detectarDelimitador(primeraLinea: string): string {
  const comas = (primeraLinea.match(/,/g) ?? []).length;
  const puntoycoma = (primeraLinea.match(/;/g) ?? []).length;
  const tabs = (primeraLinea.match(/\t/g) ?? []).length;
  if (tabs > comas && tabs > puntoycoma) return "\t";
  return puntoycoma > comas ? ";" : ",";
}

export function parseCsv(texto: string): { cabeceras: string[]; filas: FilaCsv[] } {
  if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1); // BOM
  const delim = detectarDelimitador(texto.split(/\r?\n/, 1)[0] ?? "");

  const registros: string[][] = [];
  let campo = "";
  let registro: string[] = [];
  let entreComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          entreComillas = false;
        }
      } else {
        campo += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === delim) {
      registro.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      registro.push(campo);
      campo = "";
      registros.push(registro);
      registro = [];
    } else {
      campo += c;
    }
  }
  if (campo !== "" || registro.length > 0) {
    registro.push(campo);
    registros.push(registro);
  }

  // Descarta líneas totalmente vacías
  const utiles = registros.filter((r) => r.some((x) => x.trim() !== ""));
  if (utiles.length === 0) return { cabeceras: [], filas: [] };

  const cabeceras = utiles[0].map((h) => h.trim());
  const filas = utiles.slice(1).map((r) => {
    const fila: FilaCsv = {};
    cabeceras.forEach((h, i) => {
      fila[h] = (r[i] ?? "").trim();
    });
    return fila;
  });
  return { cabeceras, filas };
}

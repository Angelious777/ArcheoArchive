// Utilidades de presentación compartidas por servidor y cliente.

/** Convierte un registro de la base de datos en valores de formulario (todo texto). */
export function aValoresFormulario(registro: Record<string, unknown>): Record<string, string> {
  const salida: Record<string, string> = {};
  for (const [k, v] of Object.entries(registro)) {
    if (v === null || v === undefined) salida[k] = "";
    else if (typeof v === "boolean") salida[k] = v ? "si" : "no";
    else if (v instanceof Date) continue;
    else if (typeof v === "object") continue;
    else salida[k] = String(v);
  }
  return salida;
}

export const ETIQUETA_CATEGORIA: Record<string, string> = {
  VASIJA: "Vasija",
  HERRAMIENTA: "Herramienta / materia prima",
  ESCULTORICA: "Escultórica (efigie, antropomorfa, zoomorfa)",
};

export const ETIQUETA_TAMANO: Record<string, string> = {
  PEQUENO: "Pequeño",
  MEDIANO: "Mediano",
  GRANDE: "Grande",
  MUY_GRANDE: "Muy grande",
};

// Validación de fichas (se usa en el servidor, en el formulario y en el importador).
import { z } from "zod";

/** Normaliza: minúsculas y sin tildes, para comparar entradas humanas ("Pequeño" → "pequeno"). */
export function normalizar(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

const texto = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

const numero = (min: number, max: number, etiqueta: string) =>
  z.preprocess(
    (v) => {
      if (v === undefined || v === null) return null;
      if (typeof v === "string") {
        const s = v.trim().replace(",", ".");
        if (s === "") return null;
        const n = Number(s);
        return Number.isFinite(n) ? n : Number.NaN;
      }
      return v;
    },
    z
      .number({ invalid_type_error: `${etiqueta} debe ser un número` })
      .min(min, `${etiqueta} no puede ser menor que ${min}`)
      .max(max, `${etiqueta} no puede ser mayor que ${max}`)
      .nullable(),
  );

const CATEGORIAS = ["VASIJA", "HERRAMIENTA", "ESCULTORICA"] as const;
const TAMANOS = ["PEQUENO", "MEDIANO", "GRANDE", "MUY_GRANDE"] as const;

export const piezaSchema = z.object({
  // --- Obligatorios ---
  codigo: z
    .string({ required_error: "El código es obligatorio" })
    .trim()
    .min(1, "El código es obligatorio")
    .max(60, "Máximo 60 caracteres")
    .regex(
      /^[\p{L}\p{N}][\p{L}\p{N}\s._\/\-]*$/u,
      "Use solo letras, números, espacios y . _ / -",
    ),
  nombre: z
    .string({ required_error: "El nombre es obligatorio" })
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(200, "Máximo 200 caracteres"),
  materialId: z.coerce
    .number({ invalid_type_error: "Seleccione un material" })
    .int()
    .positive("Seleccione un material"),
  tipologiaId: z.coerce
    .number({ invalid_type_error: "Seleccione una tipología" })
    .int()
    .positive("Seleccione una tipología"),

  categoria: z.preprocess(
    (v) => {
      const n = normalizar(v);
      return n === "" ? "VASIJA" : n.toUpperCase();
    },
    z.enum(CATEGORIAS, { errorMap: () => ({ message: "Categoría no válida" }) }),
  ),

  // --- Opcionales: identificación y contexto ---
  descripcion: texto(4000),
  periodo: texto(120),
  estiloCultural: texto(120),
  procedencia: texto(200),
  estadoConservacion: texto(200),

  // --- Morfología y dimensiones ---
  formaGeneral: texto(120),
  formaFuncional: texto(120),
  equivalencias: texto(300),
  tamano: z.preprocess(
    (v) => {
      const n = normalizar(v).replace(/\s+/g, "_").toUpperCase();
      return n === "" ? null : n;
    },
    z.enum(TAMANOS, { errorMap: () => ({ message: "Tamaño no válido" }) }).nullable(),
  ),
  alturaMaxCm: numero(0, 1000, "La altura máxima"),
  alturaCuerpoCm: numero(0, 1000, "La altura del cuerpo"),
  alturaCuelloCm: numero(0, 1000, "La altura del cuello"),
  diametroBaseCm: numero(0, 1000, "El diámetro de la base"),
  diametroBordeCm: numero(0, 1000, "El diámetro del borde"),
  diametroMaxCm: numero(0, 1000, "El diámetro máximo"),
  grosorMm: numero(0, 1000, "El grosor"),
  pesoGr: numero(0, 1_000_000, "El peso"),

  // --- Tecnología y manufactura ---
  pasta: texto(2000),
  tecnicaFormacion: texto(200),
  tratamientoSuperficial: texto(500),
  coccion: texto(200),
  simetrica: z.preprocess((v) => {
    const n = normalizar(v);
    if (["si", "true", "1"].includes(n)) return true;
    if (["no", "false", "0"].includes(n)) return false;
    return null;
  }, z.boolean().nullable()),

  // --- Estructura y decoración ---
  componentesEstructurales: texto(2000),
  formasSecundarias: texto(2000),
  elementosAgregados: texto(2000),
  coloresPigmentos: texto(2000),
  descripcionIconografica: texto(8000),

  // --- Observaciones ---
  marcasUso: texto(4000),
  relaciones: texto(4000),

  // --- Condicionales ---
  tipoHerramienta: texto(200),
  materiaPrimaHerramienta: texto(200),
  desgasteHerramienta: texto(2000),
  detalleElementosComplejos: texto(4000),
  representacionFigurativa: texto(4000),
});

export type DatosPieza = z.infer<typeof piezaSchema>;

/** Anula los campos que no corresponden a la categoría elegida. */
export function limpiarSegunCategoria(d: DatosPieza): DatosPieza {
  const r = { ...d };
  if (r.categoria !== "HERRAMIENTA") {
    r.tipoHerramienta = null;
    r.materiaPrimaHerramienta = null;
    r.desgasteHerramienta = null;
  } else {
    // Las herramientas no usan la morfología de vasijas
    r.formaGeneral = null;
    r.formaFuncional = null;
    r.diametroBordeCm = null;
    r.diametroBaseCm = null;
    r.alturaCuelloCm = null;
    r.detalleElementosComplejos = null;
  }
  if (r.categoria !== "VASIJA") r.detalleElementosComplejos = null;
  if (r.categoria !== "ESCULTORICA") r.representacionFigurativa = null;
  return r;
}

/** Convierte los errores de Zod en { campo: mensaje } (primer mensaje por campo). */
export function erroresPorCampo(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "_");
    if (!(campo in out)) out[campo] = issue.message;
  }
  return out;
}

export const UNIDADES_MODELO = ["unidades del modelo", "mm", "cm", "m"] as const;

export const modeloSchema = z.object({
  unidad: z.enum(UNIDADES_MODELO, { errorMap: () => ({ message: "Unidad no válida" }) }),
  escalaValidada: numero(0.000001, 1_000_000, "La escala"),
});

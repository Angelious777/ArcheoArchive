// Reglas del flujo borrador → publicado (informe, Módulo 2).
// Para publicar: campos obligatorios completos + al menos una fotografía (RD-11).

export type DatosPublicables = {
  codigo?: string | null;
  nombre?: string | null;
  materialId?: number | null;
  tipologiaId?: number | null;
};

/** Devuelve la lista de problemas que impiden publicar. Vacía = se puede publicar. */
export function faltantesParaPublicar(p: DatosPublicables, cantidadFotos: number): string[] {
  const faltan: string[] = [];
  if (!p.codigo?.trim()) faltan.push("Falta el código de inventario.");
  if (!p.nombre?.trim()) faltan.push("Falta el nombre de la pieza.");
  if (!p.materialId) faltan.push("Falta seleccionar el material.");
  if (!p.tipologiaId) faltan.push("Falta seleccionar la tipología.");
  if (cantidadFotos < 1) faltan.push("Debe tener al menos una fotografía asociada.");
  return faltan;
}

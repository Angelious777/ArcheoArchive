// Tipo común para el estado que devuelven las server actions a los formularios.
// (Vive fuera de los archivos "use server", que solo pueden exportar funciones async.)
export type EstadoAccion = {
  ok?: boolean;
  mensaje?: string;
  error?: string;
  /** Errores por campo, indexados por el atributo `name` del input. */
  errores?: Record<string, string>;
  /** Mensajes por archivo (carga de varias fotografías). */
  detalles?: string[];
};

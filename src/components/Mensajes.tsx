import type { EstadoAccion } from "@/lib/tipos";

/** Muestra el resultado de una server action (éxito, error y detalles por archivo). */
export function Mensajes({ estado }: { estado: EstadoAccion }) {
  return (
    <>
      {estado.ok && estado.mensaje && (
        <div className="mensaje ok" role="status">
          {estado.mensaje}
        </div>
      )}
      {estado.error && (
        <div className="mensaje error" role="alert">
          {estado.error}
          {estado.detalles && (
            <ul>
              {estado.detalles.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {!estado.error && estado.detalles && estado.detalles.length > 0 && (
        <div className="mensaje aviso" role="status">
          Algunos archivos no se cargaron:
          <ul>
            {estado.detalles.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

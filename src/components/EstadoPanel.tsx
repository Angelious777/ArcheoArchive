"use client";

import { useActionState } from "react";
import { Mensajes } from "@/components/Mensajes";
import type { EstadoAccion } from "@/lib/tipos";

type AccionSimple = (prev: EstadoAccion) => Promise<EstadoAccion>;

type Props = {
  estado: "BORRADOR" | "PUBLICADO";
  publicar: AccionSimple;
  despublicar: AccionSimple;
  eliminar: (formData: FormData) => Promise<void>;
};

export function EstadoPanel({ estado, publicar, despublicar, eliminar }: Props) {
  const [resPub, accionPub, pendPub] = useActionState<EstadoAccion>(publicar, {});
  const [resDes, accionDes, pendDes] = useActionState<EstadoAccion>(despublicar, {});

  return (
    <div className="tarjeta ui">
      <h2 style={{ marginTop: 0 }}>Estado de publicación</h2>
      <p>
        Estado actual:{" "}
        <span className={`insignia ${estado === "PUBLICADO" ? "publicado" : "borrador"}`}>
          {estado === "PUBLICADO" ? "Publicado" : "Borrador"}
        </span>
      </p>

      <Mensajes estado={resPub} />
      <Mensajes estado={resDes} />

      <div className="acciones">
        {estado === "BORRADOR" ? (
          <form action={accionPub}>
            <button type="submit" disabled={pendPub}>
              {pendPub ? "Verificando…" : "Publicar ficha"}
            </button>
          </form>
        ) : (
          <form action={accionDes}>
            <button type="submit" className="secundario" disabled={pendDes}>
              Volver a borrador
            </button>
          </form>
        )}

        <form
          action={eliminar}
          onSubmit={(e) => {
            if (
              !window.confirm(
                "¿Eliminar esta pieza definitivamente? Se borrarán también sus fotografías y su modelo 3D. Esta acción no se puede deshacer.",
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="confirmar" value="si" />
          <button type="submit" className="peligro">
            Eliminar pieza
          </button>
        </form>
      </div>
      <p className="ayuda" style={{ fontSize: ".8rem", color: "var(--texto-suave)" }}>
        Para publicar se requieren los campos obligatorios completos y al menos una fotografía.
      </p>
    </div>
  );
}

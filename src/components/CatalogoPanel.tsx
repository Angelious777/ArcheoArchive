"use client";

import { useActionState } from "react";
import { Mensajes } from "@/components/Mensajes";
import type { EstadoAccion } from "@/lib/tipos";

type Accion = (prev: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;
type AccionConId = (id: number, prev: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

export type ItemCatalogo = { id: number; nombre: string; enUso: number };

function Fila({ item, renombrar, eliminar }: { item: ItemCatalogo; renombrar: Accion; eliminar: Accion }) {
  const [resRen, accionRen, pendRen] = useActionState<EstadoAccion, FormData>(renombrar, {});
  const [resDel, accionDel, pendDel] = useActionState<EstadoAccion, FormData>(eliminar, {});
  return (
    <tr>
      <td>
        <form action={accionRen} className="acciones">
          <input name="nombre" defaultValue={item.nombre} maxLength={80} aria-label={`Nombre de ${item.nombre}`} style={{ maxWidth: 260 }} />
          <button type="submit" className="secundario" disabled={pendRen}>Renombrar</button>
        </form>
        <Mensajes estado={resRen} />
      </td>
      <td>{item.enUso}</td>
      <td>
        <form
          action={accionDel}
          onSubmit={(e) => {
            if (!window.confirm(`¿Eliminar «${item.nombre}»?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="confirmar" value="si" />
          <button type="submit" className="peligro" disabled={pendDel || item.enUso > 0}
            title={item.enUso > 0 ? "En uso: no se puede eliminar" : undefined}>
            Eliminar
          </button>
        </form>
        <Mensajes estado={resDel} />
      </td>
    </tr>
  );
}

type Props = {
  titulo: string;
  items: ItemCatalogo[];
  crear: Accion;
  renombrar: AccionConId;
  eliminar: AccionConId;
};

export function CatalogoPanel({ titulo, items, crear, renombrar, eliminar }: Props) {
  const [res, accion, pend] = useActionState<EstadoAccion, FormData>(crear, {});
  return (
    <div className="tarjeta ui">
      <h2 style={{ marginTop: 0 }}>{titulo}</h2>
      <form action={accion} className="acciones" style={{ marginBottom: ".5rem" }}>
        <input name="nombre" placeholder="Nuevo valor" maxLength={80} required aria-label={`Nuevo valor de ${titulo}`} style={{ maxWidth: 300 }} />
        <button type="submit" disabled={pend}>Agregar</button>
      </form>
      <Mensajes estado={res} />
      {items.length === 0 ? (
        <p className="vacio">Sin valores todavía.</p>
      ) : (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr><th>Nombre</th><th>Piezas</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <Fila
                  key={it.id}
                  item={it}
                  renombrar={renombrar.bind(null, it.id)}
                  eliminar={eliminar.bind(null, it.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

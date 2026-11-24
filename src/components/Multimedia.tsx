"use client";

import { useActionState } from "react";
import { Mensajes } from "@/components/Mensajes";
import type { EstadoAccion } from "@/lib/tipos";

type Accion = (prev: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

/* ------------------------------ Fotografías ------------------------------ */

export type FotoVista = { id: string; descripcion: string | null };

type AccionConId = (id: string, prev: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

type FotosProps = {
  fotos: FotoVista[];
  subir: Accion;
  eliminar: AccionConId;
  describir: AccionConId;
};

function FotoItem({ foto, eliminar, describir }: { foto: FotoVista; eliminar: Accion; describir: Accion }) {
  const [resDel, accionDel, pendDel] = useActionState<EstadoAccion, FormData>(eliminar, {});
  const [resDesc, accionDesc, pendDesc] = useActionState<EstadoAccion, FormData>(describir, {});
  return (
    <div className="foto">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/api/archivos/foto/${foto.id}`} alt={foto.descripcion ?? "Fotografía de la pieza"} loading="lazy" />
      <form action={accionDesc} style={{ marginTop: ".4rem" }}>
        <input name="descripcion" defaultValue={foto.descripcion ?? ""} placeholder="Descripción (opcional)" maxLength={300} />
        <button type="submit" className="secundario" disabled={pendDesc} style={{ marginTop: ".3rem", width: "100%" }}>
          Guardar descripción
        </button>
      </form>
      <form
        action={accionDel}
        onSubmit={(e) => {
          if (!window.confirm("¿Eliminar esta fotografía?")) e.preventDefault();
        }}
        style={{ marginTop: ".3rem" }}
      >
        <input type="hidden" name="confirmar" value="si" />
        <button type="submit" className="peligro" disabled={pendDel} style={{ width: "100%" }}>
          Eliminar
        </button>
      </form>
      <Mensajes estado={resDesc} />
      <Mensajes estado={resDel} />
    </div>
  );
}

export function FotosPanel({ fotos, subir, eliminar, describir }: FotosProps) {
  const [estado, accion, pendiente] = useActionState<EstadoAccion, FormData>(subir, {});

  return (
    <div className="tarjeta ui">
      <h2 style={{ marginTop: 0 }}>Fotografías ({fotos.length})</h2>
      <form action={accion}>
        <div className="rejilla">
          <div className="campo">
            <label htmlFor="fotos">Agregar fotografías</label>
            <input id="fotos" name="fotos" type="file" accept="image/jpeg,image/png,image/webp" multiple required />
            <span className="ayuda">JPEG, PNG o WebP. Máximo 8 MB por archivo.</span>
          </div>
          <div className="campo">
            <label htmlFor="descripcion-fotos">Descripción (opcional, se aplica a las fotos subidas)</label>
            <input id="descripcion-fotos" name="descripcion" maxLength={300} />
          </div>
        </div>
        <button type="submit" disabled={pendiente} style={{ marginTop: ".6rem" }}>
          {pendiente ? "Subiendo…" : "Subir"}
        </button>
      </form>
      <Mensajes estado={estado} />

      {fotos.length === 0 ? (
        <p className="vacio">Todavía no hay fotografías.</p>
      ) : (
        <div className="fotos" style={{ marginTop: "1rem" }}>
          {fotos.map((f) => (
            <FotoItem key={f.id} foto={f} eliminar={eliminar.bind(null, f.id)} describir={describir.bind(null, f.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Modelo 3D ------------------------------- */

const UNIDADES = ["unidades del modelo", "mm", "cm", "m"];

export type ModeloVista = {
  id: string;
  formato: string;
  unidad: string;
  escalaValidada: number | null;
} | null;

type ModeloProps = {
  modelo: ModeloVista;
  subir: Accion;
  actualizar: Accion;
  eliminar: Accion;
};

export function ModeloPanel({ modelo, subir, actualizar, eliminar }: ModeloProps) {
  const [resSubir, accionSubir, pendSubir] = useActionState<EstadoAccion, FormData>(subir, {});
  const [resAct, accionAct, pendAct] = useActionState<EstadoAccion, FormData>(actualizar, {});
  const [resDel, accionDel, pendDel] = useActionState<EstadoAccion, FormData>(eliminar, {});

  const camposMeta = (unidad: string, escala: number | null, errores?: Record<string, string>) => (
    <div className="rejilla">
      <div className="campo">
        <label htmlFor="unidad">Unidad declarada del modelo</label>
        <select id="unidad" name="unidad" defaultValue={unidad}>
          {UNIDADES.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <span className="ayuda">
          Si no hay una escala física validada, se deja «unidades del modelo»: las dimensiones del visor
          no se presentarán como centímetros ni milímetros.
        </span>
      </div>
      <div className="campo">
        <label htmlFor="escalaValidada">Escala física validada (opcional)</label>
        <input id="escalaValidada" name="escalaValidada" inputMode="decimal"
          defaultValue={escala ?? ""} aria-invalid={errores?.escalaValidada ? true : undefined} />
        <span className="ayuda">Factor que convierte unidades del modelo a cm. Vacío = sin escala validada.</span>
        {errores?.escalaValidada && <span className="error-campo">{errores.escalaValidada}</span>}
      </div>
    </div>
  );

  return (
    <div className="tarjeta ui">
      <h2 style={{ marginTop: 0 }}>Modelo 3D</h2>

      {modelo ? (
        <>
          <p>
            Modelo asociado · formato {modelo.formato} ·{" "}
            <a href={`/api/archivos/modelo/${modelo.id}`}>descargar archivo</a>
          </p>
          <form action={accionAct}>
            {camposMeta(modelo.unidad, modelo.escalaValidada, resAct.errores)}
            <button type="submit" className="secundario" disabled={pendAct} style={{ marginTop: ".6rem" }}>
              Guardar unidad y escala
            </button>
          </form>
          <Mensajes estado={resAct} />
          <form
            action={accionDel}
            onSubmit={(e) => {
              if (!window.confirm("¿Eliminar el modelo 3D de esta pieza?")) e.preventDefault();
            }}
            style={{ marginTop: ".8rem" }}
          >
            <input type="hidden" name="confirmar" value="si" />
            <button type="submit" className="peligro" disabled={pendDel}>Eliminar modelo 3D</button>
          </form>
          <Mensajes estado={resDel} />
        </>
      ) : (
        <>
          <form action={accionSubir}>
            <div className="campo" style={{ marginBottom: ".75rem" }}>
              <label htmlFor="modelo">Archivo GLB</label>
              <input id="modelo" name="modelo" type="file" accept=".glb,model/gltf-binary" required />
              <span className="ayuda">Máximo 50 MB. Una pieza admite un solo modelo en esta versión.</span>
            </div>
            {camposMeta("unidades del modelo", null, resSubir.errores)}
            <button type="submit" disabled={pendSubir} style={{ marginTop: ".6rem" }}>
              {pendSubir ? "Subiendo…" : "Asociar modelo 3D"}
            </button>
          </form>
          <Mensajes estado={resSubir} />
          <Mensajes estado={resDel} />
        </>
      )}
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { Mensajes } from "@/components/Mensajes";
import type { EstadoAccion } from "@/lib/tipos";

type Opcion = { id: number; nombre: string };
type Accion = (prev: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

type Props = {
  accion: Accion;
  materiales: Opcion[];
  tipologias: Opcion[];
  valores?: Record<string, string>;
  textoBoton: string;
};

type CampoProps = {
  name: string;
  label: string;
  valores: Record<string, string>;
  errores?: Record<string, string>;
  requerido?: boolean;
  ayuda?: string;
  filas?: number;
  ancho?: boolean;
  numerico?: boolean;
};

function Campo({ name, label, valores, errores, requerido, ayuda, filas, ancho, numerico }: CampoProps) {
  const error = errores?.[name];
  const comun = {
    id: name,
    name,
    defaultValue: valores[name] ?? "",
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${name}-error` : undefined,
  } as const;
  return (
    <div className={`campo${ancho || filas ? " ancho" : ""}`}>
      <label htmlFor={name}>
        {label}
        {requerido && <span className="req"> *</span>}
      </label>
      {filas ? (
        <textarea {...comun} rows={filas} />
      ) : (
        <input {...comun} type="text" inputMode={numerico ? "decimal" : undefined} />
      )}
      {ayuda && <span className="ayuda">{ayuda}</span>}
      {error && (
        <span id={`${name}-error`} className="error-campo">
          {error}
        </span>
      )}
    </div>
  );
}

export function PiezaForm({ accion, materiales, tipologias, valores = {}, textoBoton }: Props) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(accion, {});
  const [categoria, setCategoria] = useState(valores.categoria || "VASIJA");
  const err = estado.errores;
  const base = { valores, errores: err };

  return (
    <form action={enviar} noValidate>
      <Mensajes estado={estado} />

      <fieldset className="seccion">
        <legend>1. Metadatos y clasificación</legend>
        <div className="rejilla">
          <Campo {...base} name="codigo" label="Código de inventario / Objeto ID" requerido
            ayuda="Único en toda la colección (ej. 8057, SC/1)." />
          <Campo {...base} name="nombre" label="Nombre o denominación" requerido
            ayuda="Ej. Gran fuente Chiripa, Keru Tiwanaku." />

          <div className="campo">
            <label htmlFor="categoria">Categoría del objeto<span className="req"> *</span></label>
            <select
              id="categoria"
              name="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="VASIJA">Vasija</option>
              <option value="HERRAMIENTA">Herramienta / materia prima de alfarería</option>
              <option value="ESCULTORICA">Escultórica (efigie, antropomorfa, zoomorfa)</option>
            </select>
            <span className="ayuda">Define qué campos específicos se piden más abajo.</span>
          </div>

          <div className="campo">
            <label htmlFor="materialId">Material<span className="req"> *</span></label>
            <select id="materialId" name="materialId" defaultValue={valores.materialId ?? ""}
              aria-invalid={err?.materialId ? true : undefined}>
              <option value="">— Seleccione —</option>
              {materiales.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
            {err?.materialId && <span className="error-campo">{err.materialId}</span>}
          </div>

          <div className="campo">
            <label htmlFor="tipologiaId">Tipología<span className="req"> *</span></label>
            <select id="tipologiaId" name="tipologiaId" defaultValue={valores.tipologiaId ?? ""}
              aria-invalid={err?.tipologiaId ? true : undefined}>
              <option value="">— Seleccione —</option>
              {tipologias.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
            {err?.tipologiaId && <span className="error-campo">{err.tipologiaId}</span>}
          </div>

          <Campo {...base} name="periodo" label="Período cronológico"
            ayuda="Ej. Formativo Medio, Horizonte Medio." />
          <Campo {...base} name="estiloCultural" label="Estilo cultural"
            ayuda="Ej. Chiripa, Tiwanaku, Yura, Omereque." />
          <Campo {...base} name="procedencia" label="Procedencia" />
          <Campo {...base} name="estadoConservacion" label="Estado de conservación" />
          <Campo {...base} name="descripcion" label="Descripción general" filas={3} />
        </div>
      </fieldset>

      {categoria !== "HERRAMIENTA" && (
        <fieldset className="seccion">
          <legend>2. Morfología y dimensiones</legend>
          <div className="rejilla">
            <Campo {...base} name="formaGeneral" label="Forma general"
              ayuda="Ej. Irrestricta, Independiente restricta, Escultórica." />
            <Campo {...base} name="formaFuncional" label="Forma funcional"
              ayuda="Ej. Fuente, Cántaro, Vaso, Cuenco, Jarra." />
            <Campo {...base} name="equivalencias" label="Equivalencias lingüísticas"
              ayuda="Ej. Waqullu (aym.), Keru (que.), Basin (ing.)." />
            <div className="campo">
              <label htmlFor="tamano">Tamaño</label>
              <select id="tamano" name="tamano" defaultValue={valores.tamano ?? ""}>
                <option value="">—</option>
                <option value="PEQUENO">Pequeño</option>
                <option value="MEDIANO">Mediano</option>
                <option value="GRANDE">Grande</option>
                <option value="MUY_GRANDE">Muy grande</option>
              </select>
            </div>
            <Campo {...base} numerico name="alturaMaxCm" label="Altura máxima (cm)" />
            <Campo {...base} numerico name="alturaCuerpoCm" label="Altura del cuerpo (cm)" />
            <Campo {...base} numerico name="alturaCuelloCm" label="Altura del cuello (cm)" />
            <Campo {...base} numerico name="diametroBaseCm" label="Diámetro de la base (cm)" />
            <Campo {...base} numerico name="diametroBordeCm" label="Diámetro del borde / boca (cm)" />
            <Campo {...base} numerico name="diametroMaxCm" label="Diámetro máximo del cuerpo (cm)" />
            <Campo {...base} numerico name="grosorMm" label="Grosor de paredes (mm)" />
            <Campo {...base} numerico name="pesoGr" label="Peso (g)" />
          </div>
        </fieldset>
      )}

      {categoria === "HERRAMIENTA" && (
        <fieldset className="seccion">
          <legend>2. Dimensiones y datos de la herramienta</legend>
          <div className="rejilla">
            <div className="campo">
              <label htmlFor="tamano">Tamaño</label>
              <select id="tamano" name="tamano" defaultValue={valores.tamano ?? ""}>
                <option value="">—</option>
                <option value="PEQUENO">Pequeño</option>
                <option value="MEDIANO">Mediano</option>
                <option value="GRANDE">Grande</option>
                <option value="MUY_GRANDE">Muy grande</option>
              </select>
            </div>
            <Campo {...base} numerico name="alturaMaxCm" label="Altura / largo máximo (cm)" />
            <Campo {...base} numerico name="diametroMaxCm" label="Diámetro / ancho máximo (cm)" />
            <Campo {...base} numerico name="grosorMm" label="Grosor (mm)" />
            <Campo {...base} numerico name="pesoGr" label="Peso (g)" />
            <Campo {...base} name="tipoHerramienta" label="Tipo de herramienta (cadena operativa)"
              ayuda="Ej. cernidor, alisador, bruñidor, esteca, molde bivalvo, batán de molienda." />
            <Campo {...base} name="materiaPrimaHerramienta" label="Materia prima de la herramienta"
              ayuda="Ej. madera, metal, hueso, piedra, cuero, yeso." />
            <Campo {...base} name="desgasteHerramienta" label="Desgaste específico por uso" filas={3} />
          </div>
        </fieldset>
      )}

      <fieldset className="seccion">
        <legend>3. Tecnología y materiales</legend>
        <div className="rejilla">
          <Campo {...base} name="pasta" label="Material / composición de la pasta" filas={3}
            ayuda="Arcilla e inclusiones visibles (biotita, cuarzo, feldespatos…)." />
          <Campo {...base} name="tecnicaFormacion" label="Técnica de formación"
            ayuda="Ej. Modelado, Anillado." />
          <Campo {...base} name="tratamientoSuperficial" label="Tratamiento superficial"
            ayuda="Cara interna y externa: alisado, bruñido, pulido…" />
          <Campo {...base} name="coccion" label="Cocción"
            ayuda="Ej. Oxidante, Reducción, Oxidación incompleta." />
          <div className="campo">
            <label htmlFor="simetrica">Simetría</label>
            <select id="simetrica" name="simetrica" defaultValue={valores.simetrica ?? ""}>
              <option value="">No registrada</option>
              <option value="si">Simétrica</option>
              <option value="no">Asimétrica</option>
            </select>
          </div>
        </div>
      </fieldset>

      {categoria !== "HERRAMIENTA" && (
        <fieldset className="seccion">
          <legend>4. Componentes y decoración</legend>
          <div className="rejilla">
            <Campo {...base} name="componentesEstructurales" label="Componentes estructurales" filas={2}
              ayuda="Ej. cuerpo elipsoide vertical y cuello cilíndrico." />
            <Campo {...base} name="formasSecundarias" label="Formas secundarias (borde, labio, base)" filas={2} />
            <Campo {...base} name="elementosAgregados" label="Elementos agregados (asas, mangos, soportes, apéndices)" filas={2} />
            {categoria === "VASIJA" && (
              <Campo {...base} name="detalleElementosComplejos"
                label="Detalle de pitones, asas dobles o soportes" filas={3}
                ayuda="Pitones rectos u oblicuos, puentes al cuello; soportes trípodes/tetrápodes, macizos o huecos." />
            )}
            {categoria === "ESCULTORICA" && (
              <Campo {...base} name="representacionFigurativa" label="Representación figurativa" filas={3}
                ayuda="Postura, relieve anatómico, pastillaje, ojos en grano de café, rasgos faciales." />
            )}
            <Campo {...base} name="coloresPigmentos" label="Colores y pigmentos (con códigos Munsell)" filas={3} />
            <Campo {...base} name="descripcionIconografica" label="Descripción literal / iconográfica" filas={5}
              ayuda="Motivos pintados o incisos, bandas, frisos y paneles." />
          </div>
        </fieldset>
      )}

      <fieldset className="seccion">
        <legend>5. Observaciones y trazas de uso</legend>
        <div className="rejilla">
          <Campo {...base} name="marcasUso" label="Marcas de uso o tafonomía" filas={3}
            ayuda="Tiznados, manchas de fuego, desgastes, sales, perforaciones secundarias." />
          <Campo {...base} name="relaciones" label="Relaciones y remisiones" filas={3}
            ayuda="Referencias bibliográficas o similitudes con otras piezas." />
        </div>
      </fieldset>

      <div className="acciones ui">
        <button type="submit" disabled={pendiente}>
          {pendiente ? "Guardando…" : textoBoton}
        </button>
        <span className="ayuda" style={{ fontSize: ".8rem" }}>
          <span className="req">*</span> obligatorio. Los campos sin información documentada se dejan vacíos.
        </span>
      </div>
    </form>
  );
}

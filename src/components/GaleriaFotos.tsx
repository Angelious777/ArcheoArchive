"use client";

import { useState } from "react";

type Foto = { id: string; descripcion: string | null };

export function GaleriaFotos({ fotos, nombre }: { fotos: Foto[]; nombre: string }) {
  const [seleccionada, setSeleccionada] = useState(0);
  if (fotos.length === 0) {
    return <p className="vacio galeria-vacia">Esta pieza no tiene fotografías asociadas.</p>;
  }

  const foto = fotos[seleccionada] ?? fotos[0];
  return (
    <div className="galeria">
      <div className="galeria-principal">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/archivos/foto/${foto.id}`}
          alt={foto.descripcion ?? `Fotografía de ${nombre}`}
        />
      </div>
      <div className="galeria-pie">
        <div className="galeria-miniaturas" role="list" aria-label="Fotografías de la pieza">
          {fotos.map((item, indice) => (
            <button
              type="button"
              className={`miniatura ${indice === seleccionada ? "activa" : ""}`}
              key={item.id}
              onClick={() => setSeleccionada(indice)}
              aria-label={`Ver fotografía ${indice + 1}`}
              aria-pressed={indice === seleccionada}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/archivos/foto/${item.id}`} alt="" />
            </button>
          ))}
        </div>
        <span className="galeria-contador">{seleccionada + 1} / {fotos.length}</span>
      </div>
      {foto.descripcion && <p className="galeria-descripcion">{foto.descripcion}</p>}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type Props = {
  src: string;
  unidad: string;
  escalaValidada: number | null;
};

export function Visor3D({ src, unidad, escalaValidada }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const controles = useRef<OrbitControls | null>(null);
  const [error, setError] = useState(false);
  const [dimensiones, setDimensiones] = useState<{
    alto: number;
    ancho: number;
    profundidad: number;
    unidad: string;
  } | null>(null);

  useEffect(() => {
    const elemento = contenedor.current;
    if (!elemento) return;
    setError(false);
    const escena = new THREE.Scene();
    escena.background = new THREE.Color("#f5f1e8");
    const camara = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
    const renderizador = new THREE.WebGLRenderer({ antialias: true });
    renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    elemento.replaceChildren(renderizador.domElement);
    const controlesLocales = new OrbitControls(camara, renderizador.domElement);
    controles.current = controlesLocales;
    controlesLocales.enableDamping = true;
    escena.add(new THREE.HemisphereLight(0xffffff, 0x8a7664, 2));
    const luz = new THREE.DirectionalLight(0xffffff, 2);
    luz.position.set(3, 5, 4);
    escena.add(luz);
    let marco: number | undefined;
    let objeto: THREE.Object3D | undefined;

    const ajustar = () => {
      const ancho = elemento.clientWidth;
      const alto = Math.max(300, Math.min(520, Math.round(ancho * 0.65)));
      renderizador.setSize(ancho, alto, false);
      camara.aspect = ancho / alto;
      camara.updateProjectionMatrix();
    };
    ajustar();
    window.addEventListener("resize", ajustar);

    new GLTFLoader().load(
      src,
      (gltf) => {
        objeto = gltf.scene;
        escena.add(objeto);
        const caja = new THREE.Box3().setFromObject(objeto);
        const tamano = caja.getSize(new THREE.Vector3());
        const centro = caja.getCenter(new THREE.Vector3());
        objeto.position.sub(centro);
        const maximo = Math.max(tamano.x, tamano.y, tamano.z);
        camara.position.set(maximo * 1.8, maximo * 1.3, maximo * 1.8);
        camara.near = Math.max(maximo / 1000, 0.001);
        camara.far = Math.max(maximo * 10, 10);
        camara.lookAt(0, 0, 0);
        controlesLocales.target.set(0, 0, 0);
        controlesLocales.update();
        controlesLocales.saveState();
        const factor = escalaValidada;
        setDimensiones({
          alto: tamano.y * (factor ?? 1),
          ancho: tamano.x * (factor ?? 1),
          profundidad: tamano.z * (factor ?? 1),
          unidad: factor ? "cm" : unidad || "unidades del modelo",
        });
      },
      undefined,
      () => setError(true),
    );

    const animar = () => {
      marco = requestAnimationFrame(animar);
      controlesLocales.update();
      renderizador.render(escena, camara);
    };
    animar();
    return () => {
      if (marco) cancelAnimationFrame(marco);
      window.removeEventListener("resize", ajustar);
      controlesLocales.dispose();
      controles.current = null;
      renderizador.dispose();
      objeto?.traverse((nodo) => {
        if (nodo instanceof THREE.Mesh) {
          nodo.geometry.dispose();
          const materiales = Array.isArray(nodo.material) ? nodo.material : [nodo.material];
          materiales.forEach((material) => material.dispose());
        }
      });
    };
  }, [src, unidad, escalaValidada]);

  const reiniciar = () => {
    controles.current?.reset();
  };

  return (
    <section className="visor3d tarjeta ui" aria-label="Visor tridimensional">
      <div ref={contenedor} className="visor3d-canvas" />
      {error ? (
        <p className="mensaje error">No se pudo cargar el modelo 3D. La ficha y sus fotografías siguen disponibles.</p>
      ) : (
        <>
          <div className="acciones visor3d-controles">
            <span className="ayuda">Arrastre para rotar · rueda o gesto para acercar</span>
            <button type="button" className="secundario" onClick={reiniciar}>Restablecer cámara</button>
          </div>
          {dimensiones && (
            <p className="visor3d-medidas">
              <strong>Medidas geométricas:</strong> alto {dimensiones.alto.toFixed(2)}, ancho{" "}
              {dimensiones.ancho.toFixed(2)}, profundidad {dimensiones.profundidad.toFixed(2)}{" "}
              {dimensiones.unidad}
              {!escalaValidada && " (sin escala física validada)"}
            </p>
          )}
        </>
      )}
    </section>
  );
}

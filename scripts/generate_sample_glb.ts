// Polyfill FileReader for Node.js if needed by GLTFExporter
if (typeof (globalThis as any).FileReader === "undefined") {
  (globalThis as any).FileReader = class FileReader {
    onload: any = null;
    onerror: any = null;
    result: any = null;
    readAsArrayBuffer(blob: Blob) {
      blob.arrayBuffer().then((buffer) => {
        this.result = buffer;
        if (this.onload) this.onload({ target: this } as any);
      }).catch((err) => {
        if (this.onerror) this.onerror(err);
      });
    }
  } as any;
}

import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import fs from "node:fs";

// Create a ceramic keru (flaring beaker) using LatheGeometry
const points: THREE.Vector2[] = [];
// Profile of a Tiwanaku Keru: narrow base, slight waist, flared rim
points.push(new THREE.Vector2(0, 0)); // base center
points.push(new THREE.Vector2(3.5, 0)); // base radius 3.5 cm (diam 7 cm)
points.push(new THREE.Vector2(3.8, 4)); // lower body
points.push(new THREE.Vector2(3.4, 8)); // slight waist
points.push(new THREE.Vector2(4.5, 12)); // upper flare
points.push(new THREE.Vector2(5.5, 16)); // rim radius 5.5 cm (diam 11 cm, height 16 cm)
points.push(new THREE.Vector2(5.2, 16)); // inner rim
points.push(new THREE.Vector2(4.2, 12));
points.push(new THREE.Vector2(3.1, 8));
points.push(new THREE.Vector2(3.4, 4));
points.push(new THREE.Vector2(3.0, 0.6));
points.push(new THREE.Vector2(0, 0.6)); // inner base

const latheGeo = new THREE.LatheGeometry(points, 32);
const material = new THREE.MeshStandardMaterial({
  color: 0xba6848, // terracotta ceramic
  roughness: 0.7,
  metalness: 0.1,
});
const mesh = new THREE.Mesh(latheGeo, material);
mesh.name = "Keru_Tiwanaku";

const scene = new THREE.Scene();
scene.add(mesh);

const exporter = new GLTFExporter();
exporter
  .parseAsync(scene, { binary: true })
  .then((result) => {
    if (!(result instanceof ArrayBuffer)) {
      throw new Error("El exporter no produjo un GLB binario.");
    }
    fs.writeFileSync("test_keru.glb", Buffer.from(result));
    console.log("GLB generado: test_keru.glb (", result.byteLength, "bytes )");
  })
  .catch((error) => {
    console.error("Error al generar el GLB:", error);
    process.exitCode = 1;
  });


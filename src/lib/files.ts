// Validación de archivos subidos. Sin dependencias: se comprueba el CONTENIDO
// (firma binaria), no solo la extensión ni el tipo MIME que declara el navegador.

export const MAX_IMAGEN_BYTES = Number(process.env.MAX_IMAGE_MB ?? 8) * 1024 * 1024;
export const MAX_MODELO_BYTES = Number(process.env.MAX_MODEL_MB ?? 50) * 1024 * 1024;

export type ArchivoDetectado = {
  tipo: "imagen" | "modelo";
  mime: string;
  ext: string;
  formato: string;
};

function empieza(buf: Uint8Array, firma: number[], desde = 0): boolean {
  if (buf.length < desde + firma.length) return false;
  return firma.every((b, i) => buf[desde + i] === b);
}

/**
 * Detecta el tipo real de un archivo por su firma. Devuelve null si no es un
 * formato admitido (JPEG, PNG, WebP o GLB).
 *
 * Para GLB se verifica la cabecera (magic "glTF" + versión 2). Un GLB truncado
 * o dañado internamente pasa esta comprobación y se reporta en el visor 3D
 * (CP-08), sin afectar al resto de la ficha.
 */
export function detectarArchivo(buf: Uint8Array): ArchivoDetectado | null {
  if (empieza(buf, [0xff, 0xd8, 0xff])) {
    return { tipo: "imagen", mime: "image/jpeg", ext: "jpg", formato: "JPEG" };
  }
  if (empieza(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { tipo: "imagen", mime: "image/png", ext: "png", formato: "PNG" };
  }
  // WebP: "RIFF" ???? "WEBP"
  if (empieza(buf, [0x52, 0x49, 0x46, 0x46]) && empieza(buf, [0x57, 0x45, 0x42, 0x50], 8)) {
    return { tipo: "imagen", mime: "image/webp", ext: "webp", formato: "WEBP" };
  }
  // GLB: "glTF" + versión (uint32 LE) = 2
  if (empieza(buf, [0x67, 0x6c, 0x54, 0x46]) && empieza(buf, [0x02, 0x00, 0x00, 0x00], 4)) {
    return { tipo: "modelo", mime: "model/gltf-binary", ext: "glb", formato: "GLB" };
  }
  return null;
}

export function formatoBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

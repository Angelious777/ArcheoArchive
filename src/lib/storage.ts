// Almacenamiento de archivos en un directorio PERSISTENTE (STORAGE_DIR).
// En producción debe ser un volumen montado, nunca un directorio temporal.
// Toda la app usa solo estas funciones, de modo que migrar a un servicio de
// objetos (S3, R2, Supabase…) implica reescribir únicamente este archivo.
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

function base(): string {
  return path.resolve(process.env.STORAGE_DIR ?? "./storage");
}

function ruta(key: string): string {
  const abs = path.resolve(base(), key);
  if (!abs.startsWith(base() + path.sep)) throw new Error("Ruta de almacenamiento no válida");
  return abs;
}

export async function guardar(key: string, datos: Buffer): Promise<void> {
  const destino = ruta(key);
  await fs.mkdir(path.dirname(destino), { recursive: true });
  await fs.writeFile(destino, datos);
}

export async function eliminar(key: string): Promise<void> {
  try {
    await fs.unlink(ruta(key));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
}

/** Elimina una carpeta completa (p. ej. piezas/<id>) para no dejar archivos huérfanos. */
export async function eliminarCarpeta(prefijo: string): Promise<void> {
  await fs.rm(ruta(prefijo), { recursive: true, force: true });
}

export async function existe(key: string): Promise<boolean> {
  try {
    await fs.access(ruta(key));
    return true;
  } catch {
    return false;
  }
}

export async function tamano(key: string): Promise<number> {
  return (await fs.stat(ruta(key))).size;
}

export function flujo(key: string): ReadableStream {
  return Readable.toWeb(createReadStream(ruta(key))) as unknown as ReadableStream;
}

/** Lista recursiva de claves bajo un prefijo (usada en pruebas y verificación de huérfanos). */
export async function listar(prefijo = ""): Promise<string[]> {
  const raiz = ruta(prefijo || ".");
  const salida: string[] = [];
  async function recorrer(dir: string) {
    let entradas;
    try {
      entradas = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entradas) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await recorrer(p);
      else salida.push(path.relative(base(), p).split(path.sep).join("/"));
    }
  }
  await recorrer(raiz);
  return salida;
}

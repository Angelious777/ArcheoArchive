import { test } from "node:test";
import assert from "node:assert/strict";
import { detectarArchivo } from "../src/lib/files.ts";
import { parseCsv } from "../src/lib/csv.ts";
import { faltantesParaPublicar } from "../src/lib/publicacion.ts";

const bytes = (...n: number[]) => new Uint8Array(n);

test("detectarArchivo reconoce JPEG, PNG, WebP y GLB por firma", () => {
  assert.equal(detectarArchivo(bytes(0xff, 0xd8, 0xff, 0xe0))?.mime, "image/jpeg");
  assert.equal(
    detectarArchivo(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))?.mime,
    "image/png",
  );
  const webp = bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50);
  assert.equal(detectarArchivo(webp)?.mime, "image/webp");
  const glb = bytes(0x67, 0x6c, 0x54, 0x46, 2, 0, 0, 0, 0, 0, 0, 0);
  const d = detectarArchivo(glb);
  assert.equal(d?.tipo, "modelo");
  assert.equal(d?.formato, "GLB");
});

test("detectarArchivo rechaza formatos no admitidos (CP-07)", () => {
  const exe = new TextEncoder().encode("MZ\x90\x00 programa.exe");
  assert.equal(detectarArchivo(exe), null);
  const texto = new TextEncoder().encode("hola, esto es un txt");
  assert.equal(detectarArchivo(texto), null);
  // GLB con versión 1 no se admite
  assert.equal(detectarArchivo(bytes(0x67, 0x6c, 0x54, 0x46, 1, 0, 0, 0)), null);
  assert.equal(detectarArchivo(new Uint8Array(0)), null);
});

test("parseCsv maneja comillas, comas internas, saltos de línea y BOM", () => {
  const csv = '﻿codigo,nombre,descripcion\r\nSC/1,"Keru, grande","línea 1\nlínea 2"\r\n8057,Cántaro,\r\n';
  const { cabeceras, filas } = parseCsv(csv);
  assert.deepEqual(cabeceras, ["codigo", "nombre", "descripcion"]);
  assert.equal(filas.length, 2);
  assert.equal(filas[0].nombre, "Keru, grande");
  assert.equal(filas[0].descripcion, "línea 1\nlínea 2");
  assert.equal(filas[1].descripcion, "");
});

test("parseCsv detecta ';' como delimitador y comillas escapadas", () => {
  const { filas } = parseCsv('codigo;nombre\nA1;"dice ""hola"""\n');
  assert.equal(filas[0].nombre, 'dice "hola"');
});

test("faltantesParaPublicar exige campos obligatorios y al menos una foto (RD-11)", () => {
  const completa = { codigo: "SC/1", nombre: "Keru", materialId: 1, tipologiaId: 2 };
  assert.deepEqual(faltantesParaPublicar(completa, 1), []);
  assert.equal(faltantesParaPublicar(completa, 0).length, 1);
  assert.equal(faltantesParaPublicar({ ...completa, nombre: "  " }, 1).length, 1);
  assert.equal(faltantesParaPublicar({}, 0).length, 5);
});

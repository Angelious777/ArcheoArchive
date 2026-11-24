import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [totalPiezas, publicadas, borradores, conModelo, conFotografia] = await Promise.all([
    prisma.pieza.count(),
    prisma.pieza.count({ where: { estado: "PUBLICADO" } }),
    prisma.pieza.count({ where: { estado: "BORRADOR" } }),
    prisma.modelo3D.count(),
    prisma.fotografia.count({ where: { pieza: { estado: "PUBLICADO" } } }),
  ]);

  const resultados = [
    ["Fichas totales", totalPiezas, 10],
    ["Fichas publicadas", publicadas, 1],
    ["Fichas en borrador", borradores, 1],
    ["Modelos 3D", conModelo, 3],
    ["Fotografías de fichas publicadas", conFotografia, 1],
  ] as const;

  console.log("ArcheoArchive - comprobación de preparación Semana 4");
  let cumple = true;
  for (const [nombre, actual, minimo] of resultados) {
    const ok = actual >= minimo;
    cumple = cumple && ok;
    console.log(`${ok ? "[OK]" : "[PENDIENTE]"} ${nombre}: ${actual} (mínimo: ${minimo})`);
  }

  if (!cumple) {
    console.error("La defensa todavía no cumple todos los mínimos automáticos.");
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.pieza.count();
  console.log("Piezas count:", count);
  const piezas = await prisma.pieza.findMany({
    select: {
      id: true,
      codigo: true,
      nombre: true,
      estado: true,
      material: { select: { nombre: true } },
      tipologia: { select: { nombre: true } },
      fotografias: { select: { id: true, archivoKey: true } },
      modelo3d: { select: { id: true, archivoKey: true, unidad: true, escalaValidada: true } }
    }
  });
  console.log("PIEZAS_JSON:" + JSON.stringify(piezas));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

// Crea el administrador inicial y valores INICIALES de catálogos.
// Los valores de catálogo son una propuesta tomada de los ejemplos del formato de
// catalogación; ajústelos en /admin/catalogos con los de su colección piloto.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const MATERIALES = ["Cerámica", "Piedra", "Madera", "Hueso", "Metal", "Cuero", "Yeso"];

const TIPOLOGIAS = [
  "Fuente",
  "Cántaro",
  "Vaso / Keru",
  "Cuenco",
  "Jarra",
  "Botella",
  "Vasija escultórica / efigie",
  "Herramienta de alfarería",
  "Materia prima",
];

async function main() {
  const correo = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const nombre = process.env.ADMIN_NOMBRE ?? "Administrador";

  if (!correo || password.length < 12) {
    throw new Error("Defina ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres) en el archivo .env.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.usuario.upsert({
    where: { correo },
    update: { nombre, passwordHash, rol: "ADMIN" },
    create: { nombre, correo, passwordHash, rol: "ADMIN" },
  });
  console.log(`Administrador listo: ${correo}`);

  for (const nombreMaterial of MATERIALES) {
    await prisma.material.upsert({
      where: { nombre: nombreMaterial },
      update: {},
      create: { nombre: nombreMaterial },
    });
  }
  for (const nombreTipologia of TIPOLOGIAS) {
    await prisma.tipologia.upsert({
      where: { nombre: nombreTipologia },
      update: {},
      create: { nombre: nombreTipologia },
    });
  }
  console.log(`Catálogos listos: ${MATERIALES.length} materiales, ${TIPOLOGIAS.length} tipologías.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

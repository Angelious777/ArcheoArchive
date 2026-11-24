-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('VISITANTE', 'ADMIN');

-- CreateEnum
CREATE TYPE "EstadoPublicacion" AS ENUM ('BORRADOR', 'PUBLICADO');

-- CreateEnum
CREATE TYPE "CategoriaObjeto" AS ENUM ('VASIJA', 'HERRAMIENTA', 'ESCULTORICA');

-- CreateEnum
CREATE TYPE "Tamano" AS ENUM ('PEQUENO', 'MEDIANO', 'GRANDE', 'MUY_GRANDE');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'VISITANTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tipologia" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Tipologia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pieza" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "CategoriaObjeto" NOT NULL DEFAULT 'VASIJA',
    "estado" "EstadoPublicacion" NOT NULL DEFAULT 'BORRADOR',
    "materialId" INTEGER NOT NULL,
    "tipologiaId" INTEGER NOT NULL,
    "descripcion" TEXT,
    "periodo" TEXT,
    "estiloCultural" TEXT,
    "procedencia" TEXT,
    "estadoConservacion" TEXT,
    "formaGeneral" TEXT,
    "formaFuncional" TEXT,
    "equivalencias" TEXT,
    "tamano" "Tamano",
    "alturaMaxCm" DOUBLE PRECISION,
    "alturaCuerpoCm" DOUBLE PRECISION,
    "alturaCuelloCm" DOUBLE PRECISION,
    "diametroBaseCm" DOUBLE PRECISION,
    "diametroBordeCm" DOUBLE PRECISION,
    "diametroMaxCm" DOUBLE PRECISION,
    "grosorMm" DOUBLE PRECISION,
    "pesoGr" DOUBLE PRECISION,
    "pasta" TEXT,
    "tecnicaFormacion" TEXT,
    "tratamientoSuperficial" TEXT,
    "coccion" TEXT,
    "simetrica" BOOLEAN,
    "componentesEstructurales" TEXT,
    "formasSecundarias" TEXT,
    "elementosAgregados" TEXT,
    "coloresPigmentos" TEXT,
    "descripcionIconografica" TEXT,
    "marcasUso" TEXT,
    "relaciones" TEXT,
    "tipoHerramienta" TEXT,
    "materiaPrimaHerramienta" TEXT,
    "desgasteHerramienta" TEXT,
    "detalleElementosComplejos" TEXT,
    "representacionFigurativa" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pieza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fotografia" (
    "id" TEXT NOT NULL,
    "piezaId" TEXT NOT NULL,
    "archivoKey" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fotografia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modelo3D" (
    "id" TEXT NOT NULL,
    "piezaId" TEXT NOT NULL,
    "archivoKey" TEXT NOT NULL,
    "formato" TEXT NOT NULL DEFAULT 'GLB',
    "unidad" TEXT NOT NULL DEFAULT 'unidades del modelo',
    "escalaValidada" DOUBLE PRECISION,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Modelo3D_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Material_nombre_key" ON "Material"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Tipologia_nombre_key" ON "Tipologia"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Pieza_codigo_key" ON "Pieza"("codigo");

-- CreateIndex
CREATE INDEX "Pieza_estado_idx" ON "Pieza"("estado");

-- CreateIndex
CREATE INDEX "Pieza_materialId_idx" ON "Pieza"("materialId");

-- CreateIndex
CREATE INDEX "Pieza_tipologiaId_idx" ON "Pieza"("tipologiaId");

-- CreateIndex
CREATE INDEX "Fotografia_piezaId_idx" ON "Fotografia"("piezaId");

-- CreateIndex
CREATE UNIQUE INDEX "Modelo3D_piezaId_key" ON "Modelo3D"("piezaId");

-- AddForeignKey
ALTER TABLE "Pieza" ADD CONSTRAINT "Pieza_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pieza" ADD CONSTRAINT "Pieza_tipologiaId_fkey" FOREIGN KEY ("tipologiaId") REFERENCES "Tipologia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fotografia" ADD CONSTRAINT "Fotografia_piezaId_fkey" FOREIGN KEY ("piezaId") REFERENCES "Pieza"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modelo3D" ADD CONSTRAINT "Modelo3D_piezaId_fkey" FOREIGN KEY ("piezaId") REFERENCES "Pieza"("id") ON DELETE CASCADE ON UPDATE CASCADE;

# ArcheoArchive · Semana 4

Sistema responsivo para gestión, catalogación digital y consulta pública de piezas arqueológicas,
con fotografías, modelos 3D interactivos y cálculo de dimensiones geométricas.

> **Estado del MVP.** Administración protegida, CRUD, catálogos, publicación, catálogo público,
> visor Three.js y persistencia están implementados. La matriz CP-01 a CP-13 debe completarse con
> evidencia contra PostgreSQL y el despliegue elegido: ver `docs/PRUEBAS_SEMANA4.md`.

## Puesta en marcha

Requisitos: Node 20.9+ y PostgreSQL 16 (o Docker).

```bash
npm install
cp .env.example .env          # editar AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up -d          # PostgreSQL local (omitir si ya tiene uno)
npx prisma migrate dev --name inicial   # crea las tablas
npm run db:seed               # administrador + valores iniciales de catálogos
npm run dev                   # http://localhost:3000/admin
```

Generar un `AUTH_SECRET` real: `openssl rand -base64 48`.

## Cargar los datos ya recolectados

1. Ajuste los catálogos en **/admin/catalogos** (materiales y tipologías de su colección).
2. Llene `data/plantilla_piezas.csv` (una fila por pieza; las columnas son los campos del formato de
   catalogación; ver `docs/CAMBIOS_AL_INFORME.md`). Deje vacío lo que no esté documentado.
3. Simule primero y luego importe:

```bash
npm run importar -- data/mis_piezas.csv --dry-run
npm run importar -- data/mis_piezas.csv --fotos ./mis_fotos
```

- Todo queda en **borrador**; se publica desde el panel cuando la ficha tenga al menos una fotografía.
- Un código ya existente se omite. `--crear-catalogos` crea materiales/tipologías que falten.
- Columnas `fotos` (nombres separados por `|`), `modelo`, `unidad` y `escalaValidada` cargan los
  archivos desde la carpeta indicada con `--fotos`, con las mismas validaciones que el panel.

## Estructura

| Ruta | Contenido |
|---|---|
| `prisma/schema.prisma` | Modelo de datos (integridad referencial, cascadas, restricciones) |
| `src/lib/auth.ts`, `token.ts` | Sesión (JWT en cookie httpOnly), hash bcrypt, `requireAdmin()` |
| `src/middleware.ts` | Redirección al login (capa extra; la autorización real está en cada acción) |
| `src/app/admin/actions.ts` | Todas las operaciones administrativas |
| `src/lib/validation.ts` | Validación de fichas (formulario e importador) |
| `src/lib/files.ts`, `media.ts`, `storage.ts` | Validación por contenido, registro y almacenamiento de archivos |
| `src/app/api/archivos/[tipo]/[id]` | Entrega de archivos (borradores solo para el administrador) |
| `src/lib/catalogo-publico.ts` | Consultas públicas filtradas estrictamente por `PUBLICADO` |
| `src/app/api/catalogo` | API pública de listado y detalle |
| `src/app/catalogo` | Catálogo, filtros, búsqueda y ficha pública |
| `src/components/Visor3D.tsx` | Visor GLB con controles y bounding box |
| `scripts/importar.ts` | Importador CSV |

## Despliegue y persistencia

Los archivos van a `STORAGE_DIR`. En producción debe ser un **volumen persistente** (no `/tmp`, no el
sistema de archivos efímero del contenedor). Para pasar a almacenamiento de objetos basta reescribir
`src/lib/storage.ts` (mismas seis funciones). Haga la prueba de humo de persistencia (CP-13) en la
primera semana de despliegue, como indica el informe.

## Pruebas

```bash
npm test          # lógica pura: firmas de archivo, CSV, reglas de publicación
npm run typecheck
npm run build
npm run check:week4 # mínimos automáticos: fichas, publicadas, modelos y fotografía
```

### Verificación de Semana 4

1. Inicie PostgreSQL y la aplicación (`npm run dev`) y abra `/catalogo` sin iniciar sesión.
2. Confirme que una pieza `PUBLICADO` aparece, mientras una pieza `BORRADOR` no aparece ni por
   búsqueda directa ni mediante `/api/catalogo/[id]` (responde 404).
3. Pruebe búsqueda por nombre/código, filtros por material/tipología y una combinación sin
   resultados; debe mostrarse un mensaje claro.
4. Abra una ficha con fotografías y otra con modelo GLB. En el visor pruebe rotación, zoom y
   «Restablecer cámara». Las medidas sin `escalaValidada` deben indicar «unidades del modelo»;
   con escala válida deben indicar cm.
5. Para probar el fallo controlado, sustituya temporalmente el archivo GLB por datos inválidos:
   la ficha debe seguir mostrando sus datos y fotografías junto al mensaje del visor.

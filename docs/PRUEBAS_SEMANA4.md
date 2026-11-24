# ArcheoArchive · Semana 4

# Registro de verificación final

## Estado de ejecución

Este documento sirve como matriz de evidencias para los casos CP-01 a CP-13. Una celda sin
captura, fecha, URL o registro no debe marcarse como aprobada.

Comandos base:

```bash
npm test
npm run typecheck
npm run build
npm run check:week4
npx prisma migrate deploy
```

## Evidencias técnicas mínimas

- Captura o registro del número de fichas publicadas y modelos asociados.
- Archivo `Piezas` exportado desde Prisma Studio o consulta SQL equivalente.
- Registro de las rutas públicas y administrativas antes y después de una sesión.
- Capturas de escritorio y móvil del catálogo y del visor.
- Captura del directorio persistente antes y después del redespliegue.

## Matriz CP-01 a CP-13

| Caso | Evidencia requerida | Resultado | Fecha / referencia |
|---|---|---|---|
| CP-01 | Captura del formulario guardado y fila en Prisma Studio; estado BORRADOR | Pendiente | |
| CP-02 | Mensaje de código duplicado y conteo sin duplicado | Pendiente | |
| CP-03 | Errores visibles y ausencia de fila nueva | Pendiente | |
| CP-04 | Respuestas HTTP 401/404 o redirección a login sin sesión | Pendiente | |
| CP-05 | Ficha publicada visible y borrador oculto en catálogo/API | Pendiente | |
| CP-06 | Búsqueda por nombre/código y filtros; combinación sin resultados | Pendiente | |
| CP-07 | JPEG válido asociado; TXT/EXE renombrado rechazado por contenido | Pendiente | |
| CP-08 | GLB válido renderizado; archivo corrupto con fallback controlado | Pendiente | |
| CP-09 | Rotación, zoom y restablecimiento en escritorio y móvil | Pendiente | |
| CP-10 | Tabla esperado vs. obtenido con el modelo geométrico conocido | Pendiente | |
| CP-11 | Sin escala: «unidades del modelo»; con escala: «cm» | Pendiente | |
| CP-12 | Registro y archivos eliminados; sin filas o archivos huérfanos | Pendiente | |
| CP-13 | Datos PostgreSQL y STORAGE_DIR intactos tras redesplegar | Pendiente | |

## Plantilla CP-10: dimensiones geométricas

| Eje | Geometría esperada | Resultado obtenido | Unidad |
|---|---:|---:|---|
| Alto | | | |
| Ancho | | | |
| Profundidad | | | |

## Plantilla CP-12: integridad en cascada

```sql
SELECT f.id
FROM "Fotografia" f
LEFT JOIN "Pieza" p ON p.id = f."piezaId"
WHERE p.id IS NULL;

SELECT m.id
FROM "Modelo3D" m
LEFT JOIN "Pieza" p ON p.id = m."piezaId"
WHERE p.id IS NULL;
```

Ambas consultas deben devolver cero filas.

## Plantilla CP-13: persistencia tras redespliegue

Registrar antes y después:

- URL pública del despliegue.
- Fecha y hora del despliegue.
- Conteo de piezas en PostgreSQL.
- Conteo de fotografías y modelos en PostgreSQL.
- Conteo y suma de bytes de archivos bajo `STORAGE_DIR`.
- Tres URLs públicas probadas antes y después.
- Resultado de iniciar sesión después del redespliegue.

## Criterios de defensa

- Colección piloto identificada y procedencia documentada.
- PostgreSQL gestionado o contenedor persistente con migraciones aplicadas.
- Login administrativo, logout y autorización servidor funcionando.
- Al menos 10 fichas documentadas y 3 modelos 3D funcionales.
- Solo fichas PUBLICADO visibles en catálogo y API.
- Búsqueda y filtros operativos.
- Visor responsive con controles y unidades correctas.
- Persistencia PostgreSQL y archivos demostrada después de reiniciar/redesplegar.
- Evidencias CP-01 a CP-13 enlazadas desde el informe final.

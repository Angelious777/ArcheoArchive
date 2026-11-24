# Pruebas de la Semana 2 (casos del informe, apartado 5.8)

**Ninguna de estas pruebas se ha ejecutado todavía contra la aplicación real.** Es la lista para
recorrerlas y guardar la evidencia. Pasos previos: `npm install`, migración y `npm run db:seed`.

| Caso | Cómo probarlo | Resultado esperado | Evidencia |
|---|---|---|---|
| CP-01 | Iniciar sesión → *Nueva pieza* → completar código, nombre, material, tipología → guardar | Ficha creada como **Borrador** | Captura + fila en `prisma studio` |
| CP-02 | Crear otra pieza con el mismo código | Mensaje «Ya existe una pieza con ese código»; no se duplica | Captura |
| CP-03 | Guardar con nombre vacío / sin material | Mensajes de validación; no se guarda | Captura |
| CP-04 | Sin sesión: abrir `/admin`, `/admin/piezas/nueva` y `/api/archivos/foto/<id de un borrador>` | Redirección al login; el archivo de borrador responde 404 | Registro de respuestas (`curl -i`) |
| CP-04 (directa) | Sin cookie, enviar un POST a una server action (copiar la petición desde DevTools y reenviarla sin cookie) | Redirección al login; no se modifica nada | Respuesta + tabla intacta |
| CP-05 (parte Sem. 2) | Publicar una ficha completa con foto; dejar otra en borrador | La publicada pasa a *Publicado*; publicar sin foto muestra «Debe tener al menos una fotografía» | Capturas |
| CP-07 | Subir un JPG válido y un `.exe` o `.txt` renombrado a `.jpg` | El JPG se asocia; el otro se rechaza por contenido | Capturas |
| CP-08 (parte Sem. 2) | Asociar un GLB válido; intentar un archivo que no sea GLB | El GLB se asocia; el no-GLB se rechaza. (El GLB corrupto se prueba con el visor, Semana 3) | Capturas |
| CP-11 (datos) | Asociar un modelo con unidad «unidades del modelo» y sin escala | Queda registrado sin escala validada | Captura de la ficha |
| CP-12 | Eliminar una pieza con fotos y modelo | Ficha eliminada; `ls storage/piezas` ya no contiene su carpeta; sin filas huérfanas en `Fotografia`/`Modelo3D` | Listado del directorio + consulta SQL |
| CP-13 | Reiniciar y volver a desplegar con el mismo volumen | Datos y archivos siguen disponibles | Capturas antes/después |

Pruebas adicionales recomendadas: eliminar un material en uso (debe rechazarse), publicar y luego
borrar la única foto (debe rechazarse), importar con `--dry-run` antes de importar de verdad.

## Comando útil para huérfanos (CP-12)

```sql
-- No debería devolver filas
SELECT f.id FROM "Fotografia" f LEFT JOIN "Pieza" p ON p.id = f."piezaId" WHERE p.id IS NULL;
SELECT m.id FROM "Modelo3D" m LEFT JOIN "Pieza" p ON p.id = m."piezaId" WHERE p.id IS NULL;
```

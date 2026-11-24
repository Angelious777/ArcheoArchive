# Cambios respecto al informe (Semana 2)

Lo que se implementó difiere o amplía el informe en los puntos siguientes. Conviene reflejarlos en
la versión final del documento.

## 1. Modelo de datos (apartado 5.2)

| Informe | Implementado | Motivo |
|---|---|---|
| Pieza con 10 campos | Pieza con los campos del formato de catalogación (≈45 campos opcionales agrupados en 5 secciones) | Sus datos recolectados ya traen esa estructura |
| — | `categoria` (VASIJA / HERRAMIENTA / ESCULTORICA) | Decide qué campos condicionales se piden (herramientas, pitones/asas/soportes, representación figurativa) |
| Pieza: código, nombre, material, tipología, estado de publicación obligatorios | **Igual**; `categoria` toma VASIJA por defecto y el estado nace en BORRADOR | Se respeta la regla del informe |
| Fotografía: id, pieza, ubicación, descripción | + `mime`, `orden` | Servir el archivo con su tipo correcto y ordenarlas |
| Modelo3D: unidad, escala validada | `unidad` ∈ {unidades del modelo, mm, cm, m}; `escalaValidada` = factor a centímetros (vacío = sin escala validada) | Define con precisión el significado del atributo; sostiene CP-11 |
| Usuario.rol | `VISITANTE` / `ADMIN` (enum) | Coincide con los dos perfiles del informe |

**Decisión que debe confirmar:** en el informe «material» es un catálogo controlado. En su formato,
«Material / composición de la pasta» es un texto largo (campo `pasta`). Se interpretó así:
- **Material** (catálogo) = materia del objeto: Cerámica, Piedra, Madera, Hueso, Metal, Cuero, Yeso.
- **Tipología** (catálogo) = categoría funcional (Fuente, Cántaro, Vaso/Keru, Cuenco, Jarra…).
- La composición de la pasta va en el campo libre `pasta`.

Los valores iniciales de catálogo salen de los ejemplos de su formato; edítelos en `/admin/catalogos`.

## 2. Formatos de archivo (Módulo 2)

- **Solo GLB** (el informe dice GLB/GLTF). Un `.gltf` suele depender de archivos externos (texturas,
  `.bin`) y no se puede validar como un único archivo. Si lo necesita, se amplía en la Semana 3.
- Fotografías: JPEG, PNG o WebP, máx. 8 MB. Modelos: máx. 50 MB. Ambos configurables por variable de
  entorno. Se valida el **contenido** (firma binaria), no solo la extensión.
- CP-08 (GLB corrupto): la carga solo verifica la cabecera GLB. Un archivo dañado internamente se
  asocia igual y el visor de la Semana 3 debe mostrar el error sin afectar la ficha, como pide el informe.

## 3. Tecnología (apartado 5.4)

Se añaden librerías de apoyo no listadas en la tabla: **Zod** (validación cliente/servidor),
**bcryptjs** (hash de contraseñas), **jose** (firma de sesión) y **tsx** (scripts de importación).
No se usa Three.js todavía (Semana 3). Next.js 15 y Prisma 6.

## 4. Almacenamiento (apartado 5.4)

Implementado como **directorio en volumen persistente** (`STORAGE_DIR`), una de las dos opciones que
cita el informe. Todo el acceso pasa por `src/lib/storage.ts`, así que cambiar a un servicio de objetos
no toca el resto del código. El proveedor sigue sin fijarse (decisión de la semana 1).

## 5. Reglas adicionales no contempladas en el informe

- No se puede eliminar la **última fotografía de una ficha publicada** (la ficha dejaría de cumplir la
  regla de publicación); hay que pasarla a borrador primero.
- Código de inventario: letras, números, espacios y `. _ / -` (admite `8057` y `SC/1`).
- Sesión de 8 horas en cookie `httpOnly`; máximo 5 intentos de login fallidos por 15 min (por correo e IP,
  en memoria del proceso).
- Los archivos de piezas en **borrador** solo se entregan al administrador autenticado.
- Importador CSV por lotes (no estaba en el informe; ahorra la carga manual de sus datos).

## 6. Alcance de la Semana 2

Incluye: login/logout, autorización en servidor, CRUD de piezas, catálogos administrables, fotos,
asociación de modelo 3D con unidad/escala, borrador/publicado e importador.
**No** incluye todavía: catálogo público, búsqueda/filtros públicos y visor 3D (Semana 3).
La búsqueda del panel (por código/nombre y estado) es solo administrativa.

# Fase 2: catálogo. Reporte de entrega

Punto de revisión 2 del estándar Lumacode v2. Las capturas están en `docs/capturas/` (archivos `fase2-*`, más sugerencias, zoom, hoja de filtros y barra fija).

## Qué se hizo

| Pieza | Detalle |
|---|---|
| **Categoría** `/categorias/[slug]` | Listado con filtros de subcategoría, marca, rango de precio, disponibilidad y atributos de variante (color, capacidad, etc.); orden por relevancia, precio y más nuevos; paginación de 12 en 12; migas de pan; estados de carga, vacío y filtros sin resultados. |
| **Búsqueda** `/buscar?q=` | Mismo listado y filtros. Encuentra sin importar tildes ni mayúsculas ("audifonos" → "Audífonos") y "wifi" encuentra "Wi-Fi". Ordena por relevancia: un nombre que contiene la frase va antes que una descripción. |
| **Buscador del encabezado** | Sugerencias de productos y categorías mientras escribes (combobox accesible: flechas, Enter, Escape). Sin JavaScript sigue enviando el formulario. |
| **Ficha** `/productos/[slug]` | Galería deslizable con miniaturas y zoom; selector de variantes con precio, stock y fotos propias por variante; precio anterior y ahorro; disponibilidad real; cantidad; entrega y garantía; descripción; especificaciones; productos relacionados; barra fija en móvil que aparece cuando el botón principal sale de pantalla. La variante elegida queda en la URL (`?variante=SKU`). |
| **Filtros** | En escritorio, panel lateral. En móvil, hoja inferior con el botón "Aplicar" fijo abajo. Todo vive en la URL, así que se comparte y funciona con el botón de atrás. Los filtros aplicados se muestran como etiquetas que se quitan una a una. |
| **SEO** | Título y descripción únicos por categoría y producto (títulos ≤ 60 y descripciones ~150 caracteres), canonical, datos estructurados `Product` con `Offer`/`AggregateOffer` en GTQ y `BreadcrumbList`, `sitemap.xml` dinámico. |
| **Datos** | Subcategorías (Audífonos, Bocinas, Cargadores, Cables, Controles, Teclados), tres fotos por producto y una foto propia de variante en el seed. Migración `busqueda` con la columna `Product.searchText`. |

## Decisiones (máximo 5 líneas)

1. Los filtros son un formulario GET: funcionan sin JavaScript y dejan todo en la URL.
2. La búsqueda usa texto normalizado guardado en `Product.searchText`, sin extensiones de PostgreSQL, para que funcione igual en Neon y Supabase. Quien cree o edite productos (el panel de la fase 4) debe recalcularlo con `buildSearchText`.
3. Precio más bajo y stock se calculan con una sola consulta por listado, con las reservas descontadas: lo que se ve es lo que se puede comprar.
4. La ficha se genera en cada visita (no se guarda en caché) para que el stock mostrado sea el real.
5. Los productos de ejemplo se marcan `noindex` y no entran al sitemap, para que datos de prueba nunca se publiquen por error.

## Qué no se tocó

Diseño y textos del inicio, encabezado y pie, salvo que el buscador ahora sugiere resultados. No hay carrito ni pagos.

## Para validar con el dueño

- **Supuestos nuevos:** los productos se agrupan en categorías de un solo nivel de subcategorías; "Últimas unidades" aparece cuando el stock vendible es de 3 o menos (configurable por variante); páginas de 12 productos.
- **Textos propuestos:** mensajes de estado vacío, descripciones SEO de categorías y la frase "Envío a domicilio o recogida en tienda" que completa las descripciones cortas de producto.
- **Marcadores nuevos en la ficha:** `[Tiempo de entrega]` y `[Garantía del producto]`.
- **Imágenes:** ver `IMAGENES.md` (tres placeholders nuevos para la galería).

## Verificación

| Prueba | Resultado |
|---|---|
| `npm run lint`, `npm run typecheck`, `npm run build` | Sin errores ni advertencias |
| `npm test` | 27 pruebas pasan (dinero, disponibilidad, búsqueda, filtros de URL y selección de variantes) |
| Recorrido en navegador (Playwright, 38 comprobaciones, 4 corridas seguidas) | Todas pasan: filtros, etiquetas, orden, rango de precio, paginación y redirección de página fuera de rango, búsqueda sin tildes, sugerencias con teclado, cambio de variante y de galería, variante compartida en la URL, zoom, cantidad, agotado, últimas unidades, datos estructurados, noindex, hoja de filtros y barra fija en móvil |
| axe (WCAG 2 A/AA, 2.1 AA, 2.2 AA y buenas prácticas) | 0 violaciones en 19 combinaciones de página, ancho (360 y 1440) y estado |
| Scroll horizontal en 360, 768, 1024 y 1440 px | Ninguno |
| LCP / CLS en móvil, local sin limitar la red | 0.14 a 0.26 s / 0.000 (falta Lighthouse en el despliegue) |
| Códigos HTTP | Producto o categoría inexistente responde 404 real |

Errores que encontré y corregí al probar: un campo de precio vacío se leía como 0 y vaciaba el listado; las tarjetas mostraban la foto de una variante en lugar de la general; un producto inexistente respondía 200 en vez de 404 (se arregló comprobando su existencia antes del estado de carga).

## Checklist: casillas pendientes y por qué

- **Botón "Agregar al carrito":** en la ficha está construido pero deshabilitado hasta la fase 3, cuando existe el carrito. Las tarjetas del listado todavía no lo llevan.
- **Enlaces rotos:** `/envios`, `/garantias`, `/ingresar`, `/carrito`, `/pedido/seguimiento` y las demás páginas de las fases 3 a 5 siguen dando 404; el navegador registra esos 404 al precargar los enlaces.
- **Cabecera CSP:** va en la fase 5.
- **Open Graph de producto:** usa la imagen por defecto mientras todas las fotos sean placeholders.
- **Lighthouse en móvil:** se mide en el despliegue.

## Sugerencias fuera de alcance (no construidas)

- "Avisarme cuando llegue" para productos agotados (ya está en la fase 4 del brief).
- Conteo de productos junto a cada opción de filtro.
- Páginas de marca (`/marcas/[slug]`).

## Qué sigue

Con tu aprobación, la fase 3: carrito (cajón y página), checkout en pasos, pagos con el proveedor simulado, webhook, confirmación, correos, seguimiento y cuentas.

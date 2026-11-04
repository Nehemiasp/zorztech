# Imágenes del proyecto

| Archivo | Dónde se usa | Tipo | Fuente | Reemplazar por |
|---|---|---|---|---|
| `public/brand/zorztech-logo-oscuro.png` | Encabezado, pie y menú móvil | Logo (provisional) | PNG entregado por el dueño, recortado y con fondo transparente | Logo en SVG para fondo oscuro |
| `public/brand/zorztech-simbolo.png` | Datos estructurados `Organization` | Logo (provisional) | PNG entregado, recortado | Símbolo en SVG |
| `app/icon.png`, `app/apple-icon.png` | Favicon e ícono de app | Logo (provisional) | Símbolo "Z" sobre negro, del PNG entregado | Favicon definitivo |
| `app/opengraph-image.png` | Open Graph (1200 × 630) | Composición | Logo + diagonal de marca | Imagen aprobada por el dueño |
| `public/img/promo/banner-gaming.webp` | Inicio, hero (fondo en escritorio, banner bajo el texto en tablet) | Imagen (provisional) | Entregada por el dueño, 1983 × 793 en WebP | Confirmar derechos de uso: muestra logotipos de terceros (por ejemplo, Razer y Logitech). Para cambiarla: Panel → Configuración → Banner, horizontal 5:2 |
| `public/img/promo/banner-gaming-movil.webp` | Inicio, hero en celular (menos de 640 px) | Imagen (provisional) | Entregada por el dueño, 1116 × 2000 (9:16) en WebP | Igual que la anterior. Un banner cargado desde el panel usa su propia foto en todos los anchos |
| `public/img/categorias/{celulares,laptops,audio,accesorios,gaming,hogar-inteligente}.webp` | Inicio, categorías | Foto (provisional) | Entregadas por el dueño (`Categorias.zip`), recortadas a 4:3 y 1200 × 900 en WebP con fondo transparente | Confirmar derechos de uso: varias muestran marcas visibles de terceros (por ejemplo, un teléfono con logotipo) |
| `public/img/placeholder/producto-1x1.svg` | Tarjetas y galería de la ficha, vista frontal (seed) | Placeholder | — | Fotos reales de cada producto, 1:1, subidas desde el panel |
| `public/img/placeholder/producto-lateral-1x1.svg` | Galería de la ficha, vista lateral (seed) | Placeholder | — | Foto real, vista lateral, 1:1 |
| `public/img/placeholder/producto-detalle-1x1.svg` | Galería de la ficha, detalle (seed) | Placeholder | — | Foto real de detalle, 1:1 |
| `public/img/placeholder/producto-variante-1x1.svg` | Foto propia de una variante (audífonos blancos, seed) | Placeholder | — | Foto real de la variante, 1:1 |

Las fotos reales de producto no viven en el código: se suben desde el panel (fase 4) y cambian el campo `url` de `ProductImage`.

Material de marca sin usar todavía, guardado en `docs/brand/`: dos variantes de la mascota (ave azul) entregadas junto con el logo.

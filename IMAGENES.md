# Imágenes del proyecto

| Archivo | Dónde se usa | Tipo | Fuente | Reemplazar por |
|---|---|---|---|---|
| `public/brand/zorztech-logo-oscuro.png` | Encabezado, pie y menú móvil | Logo (provisional) | PNG entregado por el dueño, recortado y con fondo transparente | Logo en SVG para fondo oscuro |
| `public/brand/zorztech-simbolo.png` | Datos estructurados `Organization` | Logo (provisional) | PNG entregado, recortado | Símbolo en SVG |
| `app/icon.png`, `app/apple-icon.png` | Favicon e ícono de app | Logo (provisional) | Símbolo "Z" sobre negro, del PNG entregado | Favicon definitivo |
| `app/opengraph-image.png` | Open Graph (1200 × 630) | Composición | Logo + diagonal de marca | Imagen aprobada por el dueño |
| `public/img/placeholder/hero-producto-1x1.svg` | Inicio, hero | Placeholder | — | Foto del producto de la promoción, 1:1, fondo claro o transparente |
| `public/img/placeholder/categoria-celulares-4x3.svg` | Inicio, categorías | Placeholder | — | Foto de la categoría, horizontal 4:3 |
| `public/img/placeholder/categoria-laptops-4x3.svg` | Inicio, categorías | Placeholder | — | Ídem |
| `public/img/placeholder/categoria-audio-4x3.svg` | Inicio, categorías | Placeholder | — | Ídem |
| `public/img/placeholder/categoria-accesorios-4x3.svg` | Inicio, categorías | Placeholder | — | Ídem |
| `public/img/placeholder/categoria-gaming-4x3.svg` | Inicio, categorías | Placeholder | — | Ídem |
| `public/img/placeholder/categoria-hogar-inteligente-4x3.svg` | Inicio, categorías | Placeholder | — | Ídem |
| `public/img/placeholder/producto-1x1.svg` | Tarjetas y galería de la ficha, vista frontal (seed) | Placeholder | — | Fotos reales de cada producto, 1:1, subidas desde el panel |
| `public/img/placeholder/producto-lateral-1x1.svg` | Galería de la ficha, vista lateral (seed) | Placeholder | — | Foto real, vista lateral, 1:1 |
| `public/img/placeholder/producto-detalle-1x1.svg` | Galería de la ficha, detalle (seed) | Placeholder | — | Foto real de detalle, 1:1 |
| `public/img/placeholder/producto-variante-1x1.svg` | Foto propia de una variante (audífonos blancos, seed) | Placeholder | — | Foto real de la variante, 1:1 |

Las fotos reales de producto no viven en el código: se suben desde el panel (fase 4) y cambian el campo `url` de `ProductImage`.

Material de marca sin usar todavía, guardado en `docs/brand/`: dos variantes de la mascota (ave azul) entregadas junto con el logo.

# Fase 1: base. Ficha, propuesta visual y entrega

Punto de revisión 1 del estándar Lumacode v2. Las capturas están en `docs/capturas/` (360, 768, 1024 y 1440 px).

## Ficha del proyecto

- **Cliente / marca:** ZorzTech.
- **Qué hace, en una frase:** vende tecnología (celulares, laptops, audio, accesorios, gaming y hogar inteligente) en línea, con entrega a domicilio o recogida en tienda.
- **Para quién y qué busca:** consumidores finales que quieren comprar un producto sin dudas sobre precio, disponibilidad ni entrega.
- **Trabajo principal del sitio:** comprar un producto en el menor número de pasos posible.
- **Páginas incluidas en esta fase:** inicio, encabezado, pie, 404 y 500. Las demás llegan en las fases 2 a 5 (mapa de la sección 5 del brief).
- **Fuera de alcance:** factura electrónica (FEL), pasarela de pago real, textos legales.
- **Contenido disponible:** logo en PNG y dos variantes de mascota.
- **Contenido faltante (placeholder o marcador):** logo en SVG, favicon definitivo, catálogo real, fotos, tarifas de envío, tiendas de recogida, políticas, contacto, horario, redes, métodos de pago.
- **Identidad existente:** paleta y logotipo de la marca (sección 3 del brief).
- **Tono de voz:** tú, cercano y concreto. *(supuesto)*
- **Idioma:** español de Guatemala.
- **Restricciones técnicas:** Next.js, TypeScript, Tailwind, PostgreSQL con Prisma, Vercel.
- **Supuestos tomados:** los de la sección 0 del brief más los que aparecen abajo.

## Propuesta visual

**Prioridad aplicada.** La marca del cliente gana sobre el estándar (sección 1). La paleta negro y azul eléctrico coincide con una señal de la sección 5 del estándar ("fondo casi negro con un único acento"). Se mantiene porque es la identidad entregada, y se compensa con el resto de las decisiones.

### Color

| Nombre | Hex | Papel |
|---|---|---|
| Negro | `#000000` | Fondo de las zonas de marca (encabezado, hero) |
| Azul marino | `#0B1728` | Superficie oscura secundaria (panel del hero, pie) |
| Blanco | `#FFFFFF` *(provisional)* | Fondo de las zonas de compra y texto sobre oscuro |
| Azul eléctrico | `#0563F1` | Color de acción: botones, foco, enlaces |
| Celeste neón | `#4CB5FB` | Foco sobre oscuro y detalle puntual |
| Gris pizarra | `#55627A` | Texto secundario (6.2:1 sobre blanco) |

Contrastes medidos: texto sobre blanco 18.7:1; azul eléctrico sobre blanco 5.2:1 (texto de botón blanco sobre azul, igual); azul brillante `#017DFB` sobre negro 5.3:1; el azul eléctrico sobre negro solo llega a 4.1:1, por eso nunca se usa como texto sobre oscuro. Estados y bordes de campos también cumplen AA. Los tokens completos viven en `app/globals.css`.

### Tipografía

- **Sora 600** para títulos: geométrica y con carácter técnico, dialoga con el logotipo sin imitarlo.
- **IBM Plex Sans 400 y 500** para texto e interfaz: muy legible y con números tabulares reales, que importan en precios y cantidades.
- Escala de razón 1.25 sobre 16 px. Tres pesos en total. Se cargan con `next/font` (auto-alojadas, `swap`, subconjunto latino).

### Layout

Alineación a la izquierda, contenido a 1280 px, retícula de 12 columnas en escritorio. Las zonas de marca son oscuras y las de compra son claras: las fotos de producto con fondo blanco no se ven como cajas y los formularios largos se leen mejor.

```
HERO (escritorio)
+------------------------------------------------------------+
| [Z ZorzTech]  [ Buscar productos        ][Buscar]  Ingresar |
| Celulares  Laptops  Audio  Accesorios  Gaming  Hogar...     |
|------------------------------------------------------------|
|  Compra tecnología        ///////  +-------------------+    |
|  sabiendo qué pagas     /////////  |                   |    |
|  y cuándo llega       ///////////  |  foto producto 1:1|    |
|  texto de apoyo     /////////////  |                   |    |
|  [Explorar] [Seguir]  ///////////  +-------------------+    |
+------------------------------------------------------------+
        /// = panel azul marino cortado con la diagonal de la Z

SECCIÓN TIPO (categorías)
  Categorías
  +------+ +------+ +------+ +------+ +------+ +------+
  | foto | | foto | | foto | | foto | | foto | | foto |   esquina inferior
  |    / | |    / | |    / | |    / | |    / | |    / |   derecha cortada
  +------+ +------+ +------+ +------+ +------+ +------+   con la diagonal
  Celulares Laptops  Audio  Accesorios Gaming  Hogar...
```

### Elemento memorable

**La diagonal de la Z.** El corte inclinado del símbolo (unos 38° respecto a la vertical) se repite como recurso estructural: parte el hero en dos zonas, recorta la esquina de las categorías y aparece en la página 404. Todo lo demás se mantiene sobrio: sin sombras, sin brillos en botones ni tarjetas, un solo resplandor celeste detrás del producto del hero (la marca lo permite ahí).

### Principios

1. Cada dato que decide una compra (precio, disponibilidad, entrega) se dice con palabras claras y sin urgencia falsa.
2. La marca se ve arriba y la compra se hace sobre claro.
3. Un solo gesto gráfico, repetido con medida.

### Prueba de lo genérico

- *Hero:* el titular nombra lo que la tienda promete (qué pagas, cuándo llega) y tiene una acción propia de una tienda: seguir un pedido. Con otro rubro no funcionaría.
- *Categorías:* mosaico de fotos con esquina cortada por la diagonal de la marca, sin tarjetas con ícono.
- *Franja de confianza:* texto en columnas separadas por líneas, sin íconos, con información de la tienda.
- *Cambié:* un hero de "tres adjetivos" por un titular concreto; íconos en la franja por texto.

### Vista previa

Hero construido en `/` (captura `docs/capturas/home-1440.png`). El producto del hero es un placeholder diseñado con la proporción final.

## Esquema de datos

Está en `prisma/schema.prisma`, con migración inicial aplicada y verificada en PostgreSQL 16 (`prisma/migrations/20261023000000_init`). Incluye las 16 entidades de la sección 7 del brief, con montos en centavos enteros y estados del pedido como enumeración.

Cambios respecto al brief, para que los revises:

| Cambio | Motivo |
|---|---|
| `Product.isSample` | El brief pide marcar los productos de ejemplo en el panel; la tienda los muestra con la etiqueta "Producto de ejemplo". |
| `ProductVariant.lowStockThreshold` | Alerta de stock bajo configurable y regla de "Últimas unidades" con stock real. |
| `Order.reservationExpiresAt` | El cron de expiración necesita saber hasta cuándo está reservado el stock. |
| `Order.couponId` | Relación con cupones (fase 4). |
| `Payment.idempotencyKey` único y `(provider, providerRef)` único | Evitar cobros duplicados y webhooks repetidos. |
| `User.passwordHash` opcional | Permite acceso por Google más adelante. |
| Restricciones `CHECK` en SQL | Stock nunca negativo, reservado nunca mayor al stock, precios y cantidades válidos. Protegen la última unidad aunque falle una validación de la aplicación. |

El seed crea 6 categorías, 12 productos y 24 variantes genéricos (sin marcas reales), todos marcados como ejemplo. Incluye una variante agotada, una con stock bajo y varios descuentos para probar los estados. No carga tarifas de envío ni tiendas: son datos del dueño.

## Entrega

- **Qué se hizo:** proyecto Next.js con tokens de diseño, esquema y migración, seed, encabezado (con menú y búsqueda móviles), pie, inicio completo, 404 y 500, `robots.txt`, `sitemap.xml` (solo inicio), favicon y Open Graph. El brief y el estándar quedan en el repositorio (`CLAUDE.md`, `docs/`).
- **Qué no se tocó:** nada fuera de la fase 1. No hay carrito, checkout, pagos ni panel todavía.
- **Decisiones (5 líneas):** negro y azul de la marca tal cual; zonas de compra en claro; Sora + IBM Plex Sans; la diagonal de la Z como único gesto gráfico; hero y textos del inicio en `lib/content/home.ts` hasta que el panel los edite.
- **Librerías fuera de la lista del brief:** `lucide-react` (set único de íconos que exige el estándar), `@prisma/adapter-pg` y `pg` (Prisma 7 los requiere para conectarse), `dotenv` y `tsx` (comandos de Prisma y seed). `zod`, Auth.js y Resend se instalan cuando se usen.
- **Supuestos que el dueño debe confirmar:** los de la sección 0 del brief; hex del blanco de marca (provisional `#FFFFFF`); zonas de compra en claro; que la franja de confianza diga "tarifa según tu departamento".
- **Textos propuestos que el dueño debe validar:** todo lo de `lib/content/home.ts`, el pie y los títulos y descripciones de SEO.
- **Imágenes por reemplazar:** ver `IMAGENES.md`.
- **Marcadores de datos pendientes:** `[Teléfono]`, `[Correo de contacto]`, `[Horario de atención]`, `[Redes sociales]`, `[Métodos de pago por confirmar]`.
- **Cómo probarlo:** `README.md`. Con la base creada y el seed ejecutado, `npm run dev` y abrir `http://localhost:3000`.

### Verificación

| Prueba | Resultado |
|---|---|
| `npm run lint`, `npm run typecheck`, `npm run build` | Sin errores ni advertencias |
| `npm test` | 7 pruebas pasan (dinero y disponibilidad) |
| Scroll horizontal en 360, 768, 1024 y 1440 px | Ninguno |
| axe (WCAG 2 A/AA y buenas prácticas) en 360 y 1440 px | 0 violaciones |
| LCP / CLS en local, sin limitar la red | 0.2 a 0.3 s / 0.000 (falta medir con Lighthouse en el despliegue) |
| Menú móvil: abrir, Escape, búsqueda con foco | Correcto |

### Checklist: casillas pendientes y por qué

- **Sin enlaces rotos y consola limpia:** pendiente por diseño de fases. El encabezado y el pie enlazan a páginas de las fases 2 a 5 (`/categorias/...`, `/productos/...`, `/envios`, `/ingresar`, etc.); hoy devuelven 404 y el navegador registra esos 404 al precargarlas. Se resuelve al construirlas.
- **Open Graph, favicon y logo definitivos:** se usan versiones provisionales hechas con el PNG entregado.
- **Medición con Lighthouse en móvil:** se hace en el despliegue de Vercel.
- **Cabecera CSP:** las demás cabeceras de seguridad ya están; la CSP con nonce va en la fase 5.

### Cosas que decidí no construir (sugerencias)

- Botón "Agregar al carrito" en las tarjetas: llega con el carrito (fase 3).
- Sugerencias en el buscador: fase 2.
- Las dos variantes de mascota (ave azul) no se usan; si el dueño las quiere en la tienda (por ejemplo, el ave circular como avatar de redes o como ícono), se decide con él.

### Qué necesito de ti para seguir

Validar la dirección visual (sobre todo, la diagonal de la Z y las zonas oscuras y claras). Si apruebas, sigo con la fase 2 (catálogo).

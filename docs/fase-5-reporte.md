# Fase 5: cierre. Reporte de entrega

Punto de revisión 5 del estándar Lumacode v2 (entrega). Capturas en `docs/capturas/fase5-*` (360, 768, 1024 y 1440 px).

## Qué se hizo

| Pieza | Detalle |
|---|---|
| **Páginas de información** | `/envios`, `/garantias`, `/devoluciones`, `/preguntas-frecuentes`, `/terminos`, `/privacidad` y `/contacto`, antes 404 desde el pie de página. Comparten estructura (`components/info/info-page.tsx`): migas de pan con datos estructurados, un `h1` y texto con largo de línea cómodo. |
| **Qué es real y qué es marcador** | Es real lo que la tienda hace: tarifas y tiempos de `/envios` (salen de la base de datos), tiendas para recoger, datos de contacto cargados en el panel, preguntas frecuentes y qué datos y cookies usa el sitio. Es marcador visible `[…]` todo texto legal o de política: garantías, devoluciones, condiciones de envío, términos y privacidad completos. No se redactó ninguna condición. |
| **Política de contenido (CSP)** | `proxy.ts` genera un nonce por petición. Scripts: `'self'` + nonce + `strict-dynamic`, sin `'unsafe-inline'`. También `object-src 'none'`, `base-uri`, `form-action 'self'`, `frame-ancestors 'none'`, imágenes solo propias y de Vercel Blob. Los demás encabezados (HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`) ya estaban. |
| **Guía de la pasarela** | `docs/conectar-pasarela.md`: qué pedir al proveedor, qué archivo crear y qué reglas cumplir, prueba en sandbox caso por caso y lista antes de producción. |
| **Sitemap y pie** | Las páginas de información entran al sitemap; el pie enlaza a Contacto. |

## Decisiones (máximo 5 líneas)

1. Con CSP por nonce ninguna página puede prerenderse (el nonce cambia en cada petición), así que el layout raíz es `force-dynamic`. Ya casi todo leía la base de datos, por lo que el costo es mínimo; si algún día se necesita caché, se hace en la capa de datos.
2. `style-src` conserva `'unsafe-inline'` porque los atributos `style` de React no admiten nonce. Los scripts, que son lo que importa contra XSS, quedan estrictos.
3. Sin formulario de contacto: enviaría correo desde un formulario público (spam, abuso) sin que el dueño haya entregado correo ni teléfono. La página muestra los datos que cargue en el panel.
4. Las preguntas frecuentes usan `<details>` nativo: funcionan con teclado y lector de pantalla sin script.
5. La política de privacidad lista los datos y cookies que de verdad usa el sitio (carrito, sesión, acceso al último pedido) y declara que no hay cookies de publicidad ni análisis; es verificable en el código.

## Qué no se tocó

Catálogo, compra, pagos y panel de administración no cambiaron, salvo el layout raíz (dinámico) y el pie (enlace a Contacto).

## Para validar con el dueño

- Texto de garantías, devoluciones, envíos, términos y privacidad (hoy marcadores).
- Teléfono, correo, horario y redes (Panel → Configuración).
- Si quiere formulario de contacto, y a qué correo debe llegar.

## Verificación

| Prueba | Resultado |
|---|---|
| `npm run lint`, `npm run typecheck`, `npm run build` | Sin errores |
| Unitarias (`npm test`) | 86 de 86 |
| Integración (`npm run test:integration`) | 32 de 32 |
| E2E (`npm run test:e2e`, escritorio y móvil) | 66 de 66, incluida la compra completa con la CSP activa. Nuevas: 7 páginas sin errores de consola ni de CSP, tarifas desde la base de datos, marcadores visibles, enlaces del pie, preguntas con teclado, nonce y sin scripts en línea |
| axe (WCAG 2.1 AA + buenas prácticas) en 14 páginas, 360 y 1440 px | 0 violaciones |
| Desborde horizontal en 14 páginas × 4 anchos | Ninguno |
| Violaciones de CSP en consola, 14 páginas × 4 anchos | Ninguna |
| `npm audit --omit=dev` | 0 vulnerabilidades |
| Rendimiento móvil (390 px, red 1,6 Mbps con 150 ms, CPU 4× más lenta, mediana de 3) | LCP: inicio 0,41 s · categoría 0,59 s · ficha 0,56 s · búsqueda 0,56 s (meta < 2,5 s). CLS ≤ 0,09 |

Nota sobre el rendimiento: se midió contra el servidor de producción local con imágenes de ejemplo. Con fotos reales y el CDN de Vercel hay que repetirlo; no es una medición de Lighthouse ni de campo.

## Checklist: casillas pendientes y por qué

- [ ] Texto legal, de garantías, devoluciones y envíos: los entrega el dueño.
- [ ] Hex del blanco, logo en SVG y favicon: los entrega el dueño (se usan el PNG y un blanco `#FFFFFF` provisional).
- [ ] LCP en el dominio real con fotos reales: depende del catálogo real y del despliegue.
- [ ] Pasarela real: no hay proveedor. La fase 6 está preparada en `docs/conectar-pasarela.md`.

## Pendientes que conviene saber (no son defectos de esta fase)

- **Datos de ejemplo** que hay que reemplazar antes de vender: 12 productos (24 variantes), 22 tarifas de envío, la tienda de ejemplo y el cupón `EJEMPLO10`. El panel los marca.
- **Límite de intentos**: vive en memoria de cada instancia de Vercel. Con tráfico real conviene moverlo a un almacén compartido.
- **Cron de Vercel**: `vercel.json` corre una vez al día (5:00 UTC) porque el plan Hobby no admite más. Las reservas vencidas igualmente se liberan al ver el carrito, una categoría o una ficha, al crear un pedido y al abrir una confirmación; el cron es solo la red de seguridad. Con plan Pro se puede volver a `*/10 * * * *`.
- **Variables de entorno** necesarias en producción: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, `PAYMENT_PROVIDER`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`. Sin `RESEND_API_KEY` los correos solo se escriben en el registro del servidor.
- El administrador no edita aún los colores ni el logo de la marca (por tokens, en código).
- Proveedores de pago de tipo `embedded` necesitan interfaz en el checkout (descrito en la guía).

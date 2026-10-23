# ZorzTech: tienda en línea

Brief técnico y de diseño para construir la tienda completa con Claude Code.
Versión 1.0, octubre de 2026.

Este documento es la fuente de verdad del proyecto. Úsalo junto con el **Estándar Lumacode para diseño y desarrollo web (v2)**: la IA propone y ejecuta, el coordinador revisa. Si algo de aquí contradice el estándar, gana este documento.

---

## 0. Cómo trabajar este proyecto

- Colócalo en la raíz del repositorio como `CLAUDE.md` (o `AGENTS.md`).
- Trabaja **por fases** (sección 12). Al terminar cada fase, entrega el reporte del estándar v2 y espera revisión.
- **La pasarela de pago todavía no existe.** Todo el flujo de pago se construye contra un proveedor simulado y una interfaz común, para que conectar la API real sea agregar un archivo y cambiar una variable de entorno (sección 8).
- Lo marcado como **(supuesto)** está decidido para avanzar, pero hay que confirmarlo con el dueño de la tienda.

### Supuestos iniciales (confirmar)

| Tema | Supuesto |
|---|---|
| País y moneda | Guatemala, quetzales (GTQ). Precios con IVA incluido. |
| Idioma y trato | Español, trato de **tú** (tienda de tecnología al consumidor). |
| Facturación | Se pide NIT o "CF" en el checkout. La factura electrónica (FEL) queda fuera de alcance; solo se guarda el dato. |
| Envíos | Envío a domicilio con tarifa fija por departamento y recogida en tienda. |
| Catálogo | Todavía no hay productos reales: se usan productos de ejemplo claramente marcados. |
| Panel de administración | Incluido: el dueño carga productos, stock y gestiona pedidos sin tocar código. |

---

## 1. Objetivo

Una tienda en línea de tecnología donde el cliente encuentra un producto, entiende sus características, lo paga con confianza y sabe en todo momento en qué estado está su pedido. El dueño administra productos, inventario y pedidos desde un panel propio.

**Trabajo principal del sitio:** comprar un producto en el menor número de pasos posible, sin dudas sobre precio, disponibilidad ni entrega.

---

## 2. Stack técnico

| Capa | Elección | Motivo |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Páginas de producto renderizadas en servidor (SEO), rutas de API para pagos y webhooks. |
| Estilos | Tailwind CSS con tokens de la sección 4 | Tokens centralizados; sin valores sueltos. |
| Base de datos | PostgreSQL (Neon o Supabase) | Pedidos e inventario necesitan transacciones. |
| ORM | Prisma | Esquema versionado y migraciones. |
| Autenticación | Auth.js (correo y contraseña, opcional Google) | Clientes y administradores con roles. |
| Imágenes | Vercel Blob o el storage del proveedor de base de datos | Subida desde el panel. |
| Correo transaccional | Resend (o similar) | Confirmación de pedido y cambios de estado. |
| Validación | Zod en cliente y servidor | Mismas reglas en ambos lados. |
| Despliegue | Vercel | Variables de entorno por ambiente. |

No agregues librerías fuera de esta lista sin justificarlo en el reporte.

---

## 3. Identidad visual

### 3.1 Marca

- **Logo:** símbolo "Z" en dos piezas (una blanca y una azul con degradado) y el nombre "Zorz" en blanco y "Tech" en azul, con una tipografía geométrica de esquinas redondeadas.
- **Archivos necesarios:** logo en SVG (versión para fondo oscuro y para fondo claro), símbolo solo y favicon. Si no están, usa el PNG disponible como marcador y lístalo como pendiente.
- **Carácter:** tecnología confiable y moderna. Precisa, no futurista de videojuego.

### 3.2 Paleta de la marca

| Nombre | Hex | Uso indicado por la marca |
|---|---|---|
| Azul eléctrico principal | `#0563F1` | Color principal del logo y elementos destacados. |
| Azul brillante | `#017DFB` | Títulos, líneas y efectos luminosos. |
| Celeste neón | `#4CB5FB` | Brillos, bordes y detalles. |
| Negro | `#000000` | Fondo principal de la marca. |
| Azul marino oscuro | `#0B1728` | Fondos secundarios y profundidad. |
| Blanco | **[hex por confirmar]** | Textos, logotipos y contraste. |

### 3.3 Cómo se aplica en la tienda

- **Zonas de marca en oscuro:** encabezado, hero, banners de categoría y pie de página usan negro y azul marino con texto blanco.
- **Zonas de compra en claro (supuesto):** catálogo, ficha de producto, carrito y checkout usan fondo claro. Las fotos de producto suelen venir con fondo blanco y en un fondo negro se verían como cajas; además, los formularios largos se leen mejor en claro. Si el dueño prefiere todo oscuro, se cambia por tokens, sin rehacer componentes.
- **El azul eléctrico es el color de acción:** botones principales, enlaces, precio destacado y foco. No se usa para decorar.
- **El celeste neón se usa con medida:** detalles y estados activos. Los "brillos" y efectos luminosos que menciona la marca se limitan al hero y a piezas promocionales: nada de resplandores en botones, tarjetas ni formularios.
- **Contraste:** valida AA. El azul `#0563F1` sobre blanco cumple para texto; sobre negro, úsalo solo en elementos grandes o como fondo de botón con texto blanco.

### 3.4 Tipografía (propuesta, la IA puede proponer otra justificándola)

- **Títulos:** una sans geométrica con carácter técnico que dialogue con el logotipo, sin imitarlo (por ejemplo, Sora o Space Grotesk).
- **Texto e interfaz:** una sans muy legible con **números tabulares** para precios, especificaciones y cantidades.
- No uses la tipografía del logotipo para textos largos.

### 3.5 Lo que se evita

Además de la sección 5 del estándar v2: degradados en todos los fondos, tarjetas con brillo de neón, contadores de "¡Solo quedan 2!" falsos, temporizadores de oferta que se reinician, sellos de "100 % seguro" decorativos, reseñas inventadas y logos de marcas de pago o de productos que la tienda no tenga autorizados.

---

## 4. Tokens de diseño

Define estos tokens en un solo lugar (tema de Tailwind y variables CSS). Ningún componente usa hex sueltos.

```
color.brand.primary      #0563F1
color.brand.bright       #017DFB
color.brand.accent       #4CB5FB
color.brand.black        #000000
color.brand.navy         #0B1728
color.brand.white        [por confirmar]

color.surface.dark       #000000   (zonas de marca)
color.surface.dark-alt   #0B1728
color.surface.light      #FFFFFF   (zonas de compra)
color.surface.light-alt  [gris muy claro, proponer]
color.text.on-dark       [blanco de marca]
color.text.on-light      [casi negro, proponer]
color.text.muted         [gris, proponer con contraste AA]
color.border             [proponer]
color.state.success / warning / error / info   [proponer, AA]

radius.sm / md / lg      [proponer: consistente con las esquinas del logotipo]
space.*                  escala de 4 px
font.display / font.body
```

---

## 5. Mapa del sitio

### Tienda (público)

| Ruta | Página |
|---|---|
| `/` | Inicio |
| `/categorias/[slug]` | Categoría con filtros |
| `/buscar?q=` | Resultados de búsqueda |
| `/productos/[slug]` | Ficha de producto |
| `/carrito` | Carrito |
| `/checkout` | Checkout (un solo flujo, en pasos) |
| `/pedido/[codigo]/confirmacion` | Confirmación de compra |
| `/pedido/seguimiento` | Seguimiento de pedido con código y correo |
| `/cuenta` | Resumen de la cuenta |
| `/cuenta/pedidos` y `/cuenta/pedidos/[codigo]` | Historial y detalle |
| `/cuenta/direcciones` | Direcciones guardadas |
| `/ingresar`, `/registro`, `/recuperar` | Acceso |
| `/envios`, `/garantias`, `/devoluciones`, `/preguntas-frecuentes` | Información |
| `/terminos`, `/privacidad` | Legal (texto marcador, lo redacta el dueño) |
| `/contacto` | Contacto |
| 404 y 500 | Páginas de error diseñadas |

### Panel de administración (`/admin`, solo rol administrador)

| Ruta | Función |
|---|---|
| `/admin` | Resumen: pedidos del día, pendientes de pago, por enviar, productos con poco stock. |
| `/admin/productos` | Lista, búsqueda, filtros por estado y categoría. |
| `/admin/productos/nuevo` y `/[id]` | Crear y editar producto, variantes, imágenes, stock. |
| `/admin/categorias` | Categorías y orden. |
| `/admin/pedidos` y `/[codigo]` | Pedidos, cambio de estado, notas internas, historial. |
| `/admin/clientes` | Lista de clientes y sus pedidos. |
| `/admin/cupones` | Cupones de descuento (opcional, fase 4). |
| `/admin/configuracion` | Tarifas de envío, tiendas para recogida, datos de contacto, banners del inicio. |

---

## 6. Páginas de la tienda

### 6.1 Encabezado y pie

- **Encabezado:** logo, buscador con sugerencias, categorías principales, acceso a cuenta y carrito con contador. En móvil: logo, buscador desplegable, carrito y menú.
- **Pie:** categorías, información (envíos, garantías, devoluciones, preguntas frecuentes), contacto, redes, métodos de pago aceptados (solo los confirmados) y enlaces legales.

### 6.2 Inicio

1. Hero con una promoción o la propuesta de la tienda (editable desde el panel).
2. Categorías principales con imagen.
3. Productos destacados (los marca el administrador).
4. Una franja de confianza con información real: envíos, garantía, formas de pago, atención. Sin cifras inventadas.
5. Novedades o más vendidos (calculado de pedidos reales; si no hay datos, se oculta la sección).

### 6.3 Categoría y búsqueda

- Filtros: subcategoría, marca, rango de precio, disponibilidad y atributos de la categoría (por ejemplo, capacidad o color).
- Orden: relevancia, precio menor y mayor, más nuevos.
- Tarjeta de producto: imagen, nombre, precio (y precio anterior si hay descuento), disponibilidad y botón "Agregar al carrito".
- Filtros en un panel lateral en escritorio y en una hoja inferior en móvil. Los filtros se reflejan en la URL.
- Paginación o "Cargar más" con URL compartible.
- Estados: cargando (esqueletos), sin resultados (con sugerencias y botón para limpiar filtros).

### 6.4 Ficha de producto

- Galería con miniaturas y zoom; en móvil, deslizable.
- Nombre, marca, SKU, precio, precio anterior si aplica y ahorro.
- Selector de variantes (color, capacidad). Cada variante tiene su precio, stock e imágenes.
- Disponibilidad clara: "Disponible", "Últimas unidades" (solo si el stock real es bajo) o "Agotado" con opción de "Avisarme cuando llegue" (fase 4).
- Cantidad y "Agregar al carrito". En móvil, barra fija con precio y botón.
- Información de entrega y garantía del producto.
- Descripción y tabla de especificaciones técnicas.
- Productos relacionados de la misma categoría.
- Datos estructurados `Product` (precio, disponibilidad, marca, SKU).

### 6.5 Carrito

- Cajón lateral al agregar un producto, con opción de seguir comprando o ir a pagar.
- Página de carrito: productos, cantidades, eliminar, subtotal, campo de cupón (fase 4) y botón "Continuar al pago".
- El carrito persiste: en el navegador para invitados y en la base de datos para usuarios con sesión; se combinan al iniciar sesión.
- Si cambia el precio o el stock de un producto en el carrito, se avisa con un mensaje claro antes de pagar.

### 6.6 Checkout

Un solo flujo con pasos visibles y resumen del pedido siempre presente (columna lateral en escritorio, desplegable en móvil).

1. **Contacto:** correo y teléfono. Compra como invitado o con cuenta.
2. **Entrega:** envío a domicilio (dirección con departamento y municipio) o recogida en tienda. El costo de envío se calcula en el servidor.
3. **Facturación:** NIT o "CF" y nombre para la factura.
4. **Pago:** métodos disponibles según el proveedor activo (sección 8). Aceptación de términos.
5. **Revisión y pago:** resumen final con productos, envío, descuentos y total. El botón dice "Pagar Q 0,000.00" con el monto real.

Reglas:
- El total se calcula **siempre en el servidor**. El cliente nunca envía precios.
- Al iniciar el pago se crea el pedido en estado `pendiente_pago` y se **reserva el stock** por un tiempo limitado (por ejemplo, 15 minutos).
- El botón de pago se deshabilita mientras se procesa, para evitar dobles cobros.
- Errores de pago con mensajes concretos y la opción de intentar de nuevo o cambiar de método, sin perder los datos ingresados.

### 6.7 Confirmación y seguimiento

- **Confirmación:** código de pedido, resumen, método de entrega, siguiente paso y correo enviado.
- **Pago pendiente:** si el proveedor confirma después (por ejemplo, depósito o 3-D Secure), la página lo dice y se actualiza al recibir el webhook.
- **Seguimiento:** línea de tiempo con los estados del pedido (sección 7.3).

### 6.8 Cuenta

Pedidos con su estado, detalle de cada pedido, direcciones guardadas, datos personales y cambio de contraseña.

---

## 7. Modelo de datos y reglas de negocio

### 7.1 Entidades principales

```
User           id, email, passwordHash, name, phone, role (cliente | admin), createdAt
Address        id, userId, nombre, telefono, departamento, municipio, direccion, referencia, esPredeterminada
Category       id, name, slug, parentId, image, order, isActive
Brand          id, name, slug
Product        id, name, slug, brandId, categoryId, description, specs (JSON), isActive, isFeatured, createdAt
ProductVariant id, productId, sku, name, attributes (JSON: color, capacidad…), price, compareAtPrice, stock, reservedStock, isActive
ProductImage   id, productId, variantId?, url, alt, order
Cart           id, userId?, sessionId?, updatedAt
CartItem       id, cartId, variantId, quantity
Order          id, code, userId?, email, phone, status, paymentStatus, subtotal, shippingCost, discount, total,
               shippingMethod (domicilio | recogida), shippingAddress (JSON), pickupLocationId?,
               taxId (NIT o CF), taxName, notes, createdAt, paidAt
OrderItem      id, orderId, variantId, productName, variantName, sku, unitPrice, quantity   (copia del precio al comprar)
Payment        id, orderId, provider, providerRef, status, amount, currency, rawResponse (JSON), createdAt
OrderEvent     id, orderId, type, fromStatus, toStatus, actorId?, note, createdAt   (historial)
ShippingRate   id, departamento, price, estimatedDays
PickupLocation id, name, address, hours, isActive
Coupon         id, code, type (porcentaje | monto), value, minSubtotal, startsAt, endsAt, usageLimit, usedCount   (fase 4)
```

### 7.2 Dinero

- Todos los montos se guardan como **enteros en centavos** (Q 1,299.00 = `129900`). Nunca como decimales.
- Se formatean con `Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' })`.
- `OrderItem` guarda una copia del precio y del nombre al momento de la compra, para que un cambio posterior en el catálogo no altere pedidos pasados.

### 7.3 Estados del pedido

```
pendiente_pago → pagado → en_preparacion → enviado → entregado
      │                                   └→ listo_para_recoger → entregado
      ├→ pago_fallido → (reintento) → pagado
      └→ expirado (no se pagó a tiempo: libera stock)
pagado / en_preparacion → cancelado → reembolsado
```

- Cada cambio genera un `OrderEvent` y, cuando corresponde, un correo al cliente.
- Solo el webhook del proveedor (o el administrador manualmente) puede marcar un pedido como `pagado`.
- Al pasar a `pagado`, el stock reservado se descuenta del stock real. Al pasar a `expirado` o `cancelado` sin pago, la reserva se libera.

### 7.4 Inventario

- `stock` disponible = `stock - reservedStock`.
- Las operaciones de reserva y descuento se hacen dentro de una **transacción** para que dos personas no compren la última unidad.
- Un proceso programado (cron de Vercel) expira pedidos `pendiente_pago` vencidos y libera su stock.

---

## 8. Pagos: preparado para conectar la API

La pasarela todavía no está definida. La tienda se construye con una **interfaz de proveedor** y un **proveedor simulado**. Conectar la API real debe ser: crear un archivo que implemente la interfaz, agregar las variables de entorno y cambiar `PAYMENT_PROVIDER`.

### 8.1 Interfaz

```ts
// lib/payments/types.ts
export type PaymentStatus = 'pending' | 'approved' | 'declined' | 'cancelled' | 'refunded' | 'error';

export interface CreatePaymentInput {
  orderId: string;
  orderCode: string;
  amount: number;          // centavos
  currency: 'GTQ';
  customer: { email: string; name: string; phone?: string };
  returnUrl: string;       // a dónde vuelve el cliente
  cancelUrl: string;
  idempotencyKey: string;  // evita cobros duplicados
}

export type CreatePaymentResult =
  | { kind: 'redirect'; url: string; providerRef: string }               // página de pago del proveedor
  | { kind: 'embedded'; clientToken: string; providerRef: string }       // formulario del proveedor dentro de la tienda
  | { kind: 'error'; message: string };

export interface PaymentProvider {
  id: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getPaymentStatus(providerRef: string): Promise<PaymentStatus>;
  verifyWebhook(req: Request): Promise<{ providerRef: string; status: PaymentStatus; raw: unknown } | null>;
  refund?(providerRef: string, amount?: number): Promise<{ ok: boolean; message?: string }>;
}
```

### 8.2 Estructura

```
lib/payments/
  types.ts
  index.ts            ← getPaymentProvider() lee PAYMENT_PROVIDER y devuelve la implementación
  providers/
    mock.ts           ← proveedor simulado (se construye ahora)
    [proveedor].ts    ← se agrega cuando exista la API
app/api/payments/
  create/route.ts     ← crea el pedido, reserva stock y llama a createPayment
  webhook/route.ts    ← recibe la notificación del proveedor, verifica firma, actualiza pedido
  return/route.ts     ← el cliente vuelve del proveedor: consulta estado y redirige a confirmación
```

### 8.3 Proveedor simulado (`mock`)

- Página de pago de prueba propia (`/pago-simulado`) que muestra el monto y tres botones: **Aprobar**, **Rechazar** y **Dejar pendiente**.
- Cada botón dispara el mismo webhook que usará el proveedor real, para probar todo el flujo de punta a punta.
- Solo disponible cuando `PAYMENT_PROVIDER=mock`. En producción con un proveedor real, la ruta devuelve 404.

### 8.4 Reglas de seguridad de pagos

- **Nunca** se guardan ni pasan por el servidor de la tienda números de tarjeta, CVV ni fechas de vencimiento. Se usa la página o el formulario del proveedor (por eso el pago es `redirect` o `embedded`).
- El webhook **verifica la firma** del proveedor y es **idempotente**: si llega dos veces, no cobra ni descuenta stock dos veces.
- El monto del pago se compara con el `total` del pedido antes de marcarlo como pagado.
- Las llaves de la API van solo en variables de entorno del servidor. Ninguna llave secreta llega al navegador.
- Todos los intentos se registran en `Payment` con la respuesta del proveedor.

### 8.5 Variables de entorno

```
DATABASE_URL=
AUTH_SECRET=
NEXT_PUBLIC_SITE_URL=
PAYMENT_PROVIDER=mock
PAYMENT_API_KEY=            # cuando exista
PAYMENT_API_SECRET=         # cuando exista
PAYMENT_WEBHOOK_SECRET=     # cuando exista
RESEND_API_KEY=
BLOB_READ_WRITE_TOKEN=
CRON_SECRET=
```

Incluye un `.env.example` con estas variables vacías y comentadas. Nunca subas `.env` al repositorio.

### 8.6 Para conectar la API real (cuando llegue)

Deja un archivo `docs/conectar-pasarela.md` con:
1. Qué datos pedirle al proveedor (llaves, URL de sandbox, formato del webhook, firma).
2. Qué archivo crear y qué métodos implementar.
3. Cómo probar en sandbox con el flujo completo.
4. Lista de verificación antes de activar en producción.

---

## 9. Panel de administración

- **Productos:** formulario con nombre, slug automático, marca, categoría, descripción, especificaciones (pares clave–valor), variantes con SKU, precio, precio anterior y stock, imágenes con orden y texto alternativo, activar o desactivar, marcar como destacado.
- **Pedidos:** tabla con filtros por estado y fecha, búsqueda por código o correo. En el detalle: productos, cliente, entrega, pago, historial de eventos, notas internas y botones para cambiar de estado (con confirmación en acciones irreversibles como cancelar o reembolsar).
- **Inventario:** alerta de stock bajo configurable.
- **Permisos:** todas las rutas `/admin` y sus APIs validan el rol en el servidor, no solo en la interfaz.
- **Exportar:** pedidos a CSV (fase 4).

---

## 10. Contenido e imágenes

- **Productos de ejemplo:** crea un seed con unas 24 variantes en 6 categorías (por ejemplo: celulares, laptops, audio, accesorios, gaming, hogar inteligente). Usa nombres genéricos ("Audífonos inalámbricos ANC", no marcas reales con precios inventados) y márcalos como ejemplo en el panel.
- **Imágenes:** placeholders con la proporción final (1:1 para producto) o imágenes de stock genéricas, registradas en `IMAGENES.md` como indica el estándar v2.
- **Textos legales y de políticas:** marcadores claros (`[Política de devoluciones del cliente]`). No redactes condiciones legales inventadas.
- **Datos de contacto, horarios, tarifas de envío y ubicación de tiendas:** marcadores hasta que el dueño los entregue.

---

## 11. Calidad, SEO y seguridad

**SEO**
- Títulos y descripciones únicos por producto y categoría, generados desde los datos.
- Datos estructurados: `Organization`, `Product` con `Offer`, `BreadcrumbList`.
- `sitemap.xml` dinámico con productos y categorías activos; `robots.txt` que excluye `/admin`, `/checkout`, `/cuenta` y `/carrito`.
- URLs limpias por slug e imágenes optimizadas con `next/image`.

**Rendimiento:** LCP < 2.5 s en móvil en inicio, categoría y ficha de producto.

**Accesibilidad:** criterios del estándar v2; en especial, formularios del checkout con etiquetas, errores junto al campo y navegación completa con teclado.

**Seguridad**
- Contraseñas con hash (bcrypt o argon2) y límite de intentos de inicio de sesión.
- Validación con Zod en todas las rutas de API.
- Protección CSRF en formularios, encabezados de seguridad (CSP, HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`).
- Las rutas de administración y los webhooks no dependen de datos del navegador para autorizar.
- Sin datos personales en URLs ni en registros de errores.

**Pruebas mínimas**
- Unitarias: cálculo de totales, envío, descuentos y transiciones de estado del pedido.
- De integración: crear pedido → pago simulado aprobado, rechazado y pendiente → webhook duplicado → expiración de reserva.
- De punta a punta (Playwright): compra completa como invitado en móvil y escritorio.

---

## 12. Fases

| Fase | Contenido | Punto de revisión |
|---|---|---|
| 1. Base | Proyecto, tokens, esquema de datos, seed, encabezado y pie, inicio. Propuesta visual del estándar v2 con el hero construido. | Sí: dirección visual. |
| 2. Catálogo | Categorías, búsqueda con filtros, ficha de producto, SEO de producto. | Sí. |
| 3. Compra | Carrito, checkout, pagos con proveedor simulado, webhook, confirmación, correos, seguimiento, cuentas. | Sí: flujo completo con pago simulado. |
| 4. Administración | Panel completo, inventario, cambio de estados, cupones, exportación. | Sí. |
| 5. Cierre | Pruebas, accesibilidad, rendimiento, páginas legales y de información, `docs/conectar-pasarela.md`. | Sí: entrega. |
| 6. Pasarela real | Cuando exista la API: implementar el proveedor, probar en sandbox, activar. | Sí. |

---

## 13. Pendientes del dueño de la tienda

- [ ] Hex exacto del blanco de la marca.
- [ ] Logo en SVG (fondo oscuro y fondo claro) y favicon.
- [ ] Confirmar país, moneda, trato (tú o usted) y si los precios incluyen IVA.
- [ ] Proveedor de pagos y sus credenciales de sandbox.
- [ ] Catálogo real: categorías, productos, fotos, precios y stock.
- [ ] Tarifas de envío por departamento y tiendas para recogida.
- [ ] Políticas de envío, garantías, devoluciones, términos y privacidad.
- [ ] Datos de contacto, redes y horario de atención.
- [ ] Dominio.

---

## 14. Instrucción para la IA

> Lee este documento y el Estándar Lumacode v2. Trabaja por fases y empieza por la fase 1: entrega la ficha del proyecto, la propuesta visual con el hero construido y el esquema de datos, y espera revisión. Construye los pagos contra la interfaz de la sección 8 con el proveedor simulado; no elijas ni integres una pasarela real. No inventes productos de marcas reales, precios, reseñas, políticas ni datos de contacto: usa marcadores. Calcula todos los montos en el servidor y en centavos. Al terminar cada fase, entrega el reporte del estándar v2 con capturas en móvil y escritorio.

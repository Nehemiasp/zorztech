# Conectar la pasarela de pagos real

Hoy la tienda cobra con un proveedor simulado (`mock`). Conectar la pasarela real es: **crear un archivo que cumpla la interfaz, registrarlo, agregar las variables de entorno y cambiar `PAYMENT_PROVIDER`**. El resto del flujo (pedido, reserva de stock, webhook idempotente, confirmación, correos, reembolsos desde el panel) ya está construido y probado contra esa interfaz.

Esta guía es el entregable de la fase 6. Nada de lo que sigue se hizo todavía porque no hay proveedor elegido.

---

## 1. Qué pedirle al proveedor

Antes de escribir código, consigue esto por escrito o en su documentación:

| Dato | Para qué se usa |
|---|---|
| Llaves de **sandbox**: pública (si la hay), secreta y, si existe, un identificador de comercio | `PAYMENT_API_KEY` y `PAYMENT_API_SECRET` |
| URL base de la API de sandbox y la de producción | Llamadas de `createPayment`, `getPaymentStatus` y `refund` |
| **Modalidad de cobro**: ¿página del proveedor a la que se redirige, o formulario que se incrusta con un token? | Define si `createPayment` devuelve `redirect` o `embedded` |
| Cómo se crea un cobro: endpoint, campos obligatorios, formato del monto (¿centavos o decimales?), moneda GTQ admitida | `createPayment` |
| Cómo pasar `returnUrl` y `cancelUrl` | Que el cliente vuelva a `/api/payments/return` |
| **Idempotencia**: si acepta una llave de idempotencia (encabezado o campo) | Evitar cobros dobles; usa `input.idempotencyKey` |
| **Webhook**: URL que debes registrar, eventos que envía, cuerpo exacto y **cómo firma** (algoritmo, encabezado, qué cubre la firma, ventana de tiempo) | `verifyWebhook` |
| Reintentos del webhook: cuántos y cada cuánto | Confirma que responder `200` en un aviso repetido es lo correcto (ya lo es) |
| Mapa de estados del proveedor (aprobado, rechazado, pendiente, anulado, reembolsado…) | Traducirlos a `PaymentStatus` |
| Cómo consultar un cobro por su referencia | `getPaymentStatus` |
| Cómo reembolsar (total y parcial) | `refund` (opcional) |
| Tarjetas y cuentas de prueba para aprobar, rechazar y dejar pendiente | Probar los tres caminos |
| Comisiones, plazos de liquidación y métodos que habilita (tarjeta, depósito, billetera) | Texto del pie de página y de las preguntas frecuentes |
| Si exige mostrar su marca o logos | Solo se muestran los métodos **confirmados** (sección 3.5 del brief) |

## 2. Qué archivo crear y qué implementar

1. Crea `lib/payments/providers/<proveedor>.ts` que exporte un objeto `PaymentProvider` (ver `lib/payments/types.ts`):

   ```ts
   export const miProveedor: PaymentProvider = {
     id: "mi-proveedor",
     async createPayment(input) { /* … */ },
     async getPaymentStatus(providerRef) { /* … */ },
     async verifyWebhook(req) { /* … */ },
     async refund(providerRef, amount) { /* opcional */ },
   };
   export const miProveedorMethods: PaymentMethod[] = [/* los que el proveedor confirmó */];
   ```

2. Regístralo en `lib/payments/index.ts`, dentro de `registry`:

   ```ts
   "mi-proveedor": () => ({ provider: miProveedor, label: "Mi proveedor", methods: miProveedorMethods }),
   ```

3. Variables de entorno (en Vercel, por ambiente; nunca en el repositorio):

   ```
   PAYMENT_PROVIDER=mi-proveedor
   PAYMENT_API_KEY=
   PAYMENT_API_SECRET=
   PAYMENT_WEBHOOK_SECRET=
   ```

   Ninguna es `NEXT_PUBLIC_`. Si el proveedor exige una llave pública para el formulario incrustado, entrégala dentro de `clientToken`, no como variable pública.

### Reglas que el archivo debe respetar

- **`createPayment`**: manda `amount` en centavos y conviértelo al formato del proveedor en un solo lugar. Pasa `idempotencyKey`. Guarda en `providerRef` la referencia con la que el proveedor identifica el cobro: es la que llega en el webhook y la que se usa para consultar y reembolsar. Devuelve `{ kind: "error", message }` con un texto que pueda leer el cliente si el proveedor falla; nunca lances el error crudo.
- **`verifyWebhook`**: lee el cuerpo **crudo** (`await req.clone().text()`), verifica la firma con comparación de tiempo constante (`safeEqual` en `lib/security.ts`) y, si hay marca de tiempo, rechaza avisos viejos. Devuelve `null` si la firma no es válida (la ruta responde 401). Pon el monto recibido en `raw.amount`, **en centavos**: la ruta lo compara con el total del pedido antes de marcarlo como pagado.
- **Estados**: traduce todo estado desconocido a `error`, nunca a `approved`.
- **Sin datos de tarjeta**: no leas, registres ni guardes número, CVV ni vencimiento. La tienda solo ve la referencia y el estado.
- **`mock` queda como está**: `/pago-simulado` devuelve 404 y sus acciones redirigen cuando `PAYMENT_PROVIDER` no es `mock`.

### Si el proveedor es de tipo `embedded` (formulario dentro de la tienda)

La interfaz y el pedido ya lo soportan (`createPayment` puede devolver `{ kind: "embedded", clientToken }` y la ruta `/api/payments/create` lo entrega al checkout), **pero falta la interfaz**: hoy `components/checkout/checkout-flow.tsx` solo sigue el caso `redirect` y para `embedded` muestra «Esta forma de pago todavía no está disponible». Hay que:

1. Cargar el script del proveedor. Agrega su dominio a `script-src`, `connect-src` y `frame-src` en `proxy.ts` (hoy la política es estricta: `default-src 'self'`).
2. Montar el formulario con `clientToken` en un componente nuevo y, al terminar, ir a `/api/payments/return?codigo=<código del pedido>`.
3. Mantener el botón «Pagar» deshabilitado mientras se procesa.

Si el proveedor es de tipo `redirect`, no hay nada más que hacer en la interfaz.

### Dónde ve el proveedor a la tienda

| Ruta | Quién la llama | Nota |
|---|---|---|
| `POST /api/payments/webhook` | El proveedor | Registra esta URL (`https://<dominio>/api/payments/webhook`) en su panel. No usa cookies ni sesión: solo la firma. |
| `GET /api/payments/return` | El cliente, al volver | Consulta `getPaymentStatus` y redirige a la confirmación. |

## 3. Probar en sandbox, de punta a punta

1. Despliega una vista previa de Vercel (o corre local con un túnel público para recibir el webhook) con las llaves de **sandbox**.
2. Registra la URL del webhook en el panel de sandbox del proveedor.
3. Recorre estos casos y confirma el resultado en `/admin/pedidos/<código>` (estado, historial de eventos y registro del pago):

   | Caso | Resultado esperado |
   |---|---|
   | Pago aprobado | Pedido `pagado`; el stock reservado se descuenta; llega el correo de confirmación |
   | Pago rechazado | Pedido `pago_fallido`; el cliente puede reintentar o cambiar de método sin perder sus datos |
   | Pago pendiente (depósito, 3-D Secure) | La confirmación dice «pago pendiente» y se actualiza al llegar el webhook |
   | Webhook repetido (reenvíalo desde el panel del proveedor) | Sin cambios: ni cobro doble ni segundo descuento de stock |
   | Firma alterada (reenvía con `curl` cambiando un byte) | `401`, el pedido no cambia |
   | Monto distinto al total del pedido | No se marca como pagado |
   | Reserva vencida (espera 15 min o ejecuta el cron) y luego llega el pago | Si todavía hay stock, el pedido pasa a `pagado`; si no, queda un evento de alerta en el historial para reembolsar o conseguir las unidades |
   | Reembolso desde el panel | Se llama a `refund`; pedido `reembolsado`; correo al cliente |

4. Repite en móvil y en escritorio con una compra completa como invitado.
5. Las pruebas de integración (`npm run test:integration`) cubren la lógica del webhook con el proveedor simulado; agrega al menos una prueba unitaria de `verifyWebhook` con firmas válidas e inválidas del proveedor real.

## 4. Lista de verificación antes de producción

- [ ] Las llaves de **producción** están solo en las variables de entorno de Vercel (ambiente Production), no en el código ni en el chat.
- [ ] `PAYMENT_PROVIDER` apunta al proveedor real y `/pago-simulado` responde 404 en producción.
- [ ] La URL del webhook de producción está registrada y firmada con el secreto de producción (`PAYMENT_WEBHOOK_SECRET`).
- [ ] Un pago real de monto mínimo se aprueba, aparece en el panel del proveedor y se reembolsa.
- [ ] `AUTH_SECRET`, `CRON_SECRET`, `RESEND_API_KEY` y `BLOB_READ_WRITE_TOKEN` están definidos en producción.
- [ ] El cron `/api/cron/expirar-reservas` corre (ver `vercel.json`) y libera reservas vencidas.
- [ ] Los métodos de pago del pie de página (Panel → Configuración) son los que el proveedor confirmó, sin logos no autorizados.
- [ ] Los productos de ejemplo, el cupón `EJEMPLO10`, las tarifas de ejemplo y la tienda de ejemplo fueron reemplazados por datos reales.
- [ ] Términos, privacidad, envíos, garantías y devoluciones tienen el texto legal del dueño (sin marcadores `[...]` visibles).
- [ ] El dominio real está en `NEXT_PUBLIC_SITE_URL` y el sitemap lo usa.
- [ ] Los registros del servidor no contienen datos personales ni cuerpos completos de tarjeta (revisa una compra de prueba).
- [ ] Hay un plan para el límite de intentos de inicio de sesión y peticiones, que hoy vive en memoria de cada instancia: si el tráfico lo exige, muévelo a un almacén compartido (por ejemplo, Redis).

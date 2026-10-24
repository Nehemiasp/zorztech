# Fase 3: compra. Reporte de entrega

Punto de revisión 3 del estándar Lumacode v2: flujo completo con pago simulado. Capturas en `docs/capturas/fase3-*` (360 y 1440 px).

## Qué se hizo

| Pieza | Detalle |
|---|---|
| **Carrito** | Cajón lateral al agregar, página `/carrito`, contador en el encabezado. Se guarda en la base de datos: por cookie para invitados y por cuenta para usuarios; al ingresar se combinan. Precio y stock se revisan en cada lectura, con avisos claros (precio cambió, pocas unidades, agotado) antes de pagar. |
| **Tarjetas y ficha** | "Agregar al carrito" en las tarjetas con una sola variante ("Elegir opciones" si hay varias) y en la ficha, con la barra fija móvil ya conectada. |
| **Checkout** | Cinco pasos en una sola página (contacto, entrega, facturación, pago, revisión) con resumen siempre visible. Validación junto a cada campo con las mismas reglas en navegador y servidor. El borrador se conserva en la pestaña si se recarga o falla el pago. El botón dice "Pagar Q 744.00" con el monto real. |
| **Pedido** | El servidor calcula todo con los precios de la base, en centavos. Aparta el stock con una actualización atómica por unidad (dos personas no pueden comprar la última), por 15 minutos. El navegador manda además el total que vio: si no coincide, no se cobra y se le avisa. |
| **Pagos** | Interfaz `PaymentProvider` del brief y proveedor simulado con página `/pago-simulado` (Aprobar, Rechazar, Dejar pendiente). Cada botón manda al webhook real de la tienda una notificación firmada con HMAC. Rutas `create`, `retry`, `webhook` y `return`. |
| **Webhook** | Verifica la firma, es idempotente (bloquea la fila del pago), compara el monto con el total del pedido y nunca degrada un pago aprobado. Un pago aprobado tarde revive el pedido si hay stock; si no, deja una alerta en vez de vender lo que no hay. |
| **Estados e inventario** | Máquina de estados con las transiciones del brief. Al pagarse, el stock reservado pasa a venta; al expirar o cancelar, se libera. Cada cambio deja un `OrderEvent`. Expiración por cron (`/api/cron/expirar-reservas`) y también al consultar el carrito o crear un pedido. |
| **Confirmación y seguimiento** | `/pedido/[codigo]/confirmacion` según el estado (pagado, pendiente con actualización automática, fallido con reintento, expirado, cancelado). `/pedido/seguimiento` con código y correo, línea de tiempo y resumen. |
| **Correos** | Plantillas en español para pago recibido, pago fallido, enviado, listo para recoger, entregado, cancelado, reembolsado y recuperación de contraseña. Con Resend si hay llave; sin ella se escriben en la consola. |
| **Cuentas** | Auth.js v5 con correo y contraseña (bcrypt), Google opcional, registro, ingreso, recuperación por enlace de un solo uso, historial y detalle de pedidos, direcciones guardadas, datos personales y cambio de contraseña. |

## Decisiones (máximo 5 líneas)

1. El carrito de invitado vive en la base de datos, con una cookie que solo guarda un identificador, y no en el navegador: así precio y stock se validan siempre en el servidor y el carrito sigue al cliente entre dispositivos al ingresar.
2. Quien compra sin cuenta ve su pedido con una cookie firmada o con código y correo; el código solo en la URL no basta. El dueño de la cuenta y el administrador lo ven siempre.
3. Todo cambio de estado pasa por una sola función (`applyTransition`) que mueve el inventario y deja el historial; el panel de la fase 4 la reutiliza.
4. Un nuevo intento de compra del mismo carrito reemplaza al pedido anterior sin pagar y le devuelve su stock.
5. El rol de administrador siempre se lee de la base de datos, nunca del token del navegador.

## Seguridad aplicada

- Contraseñas con bcrypt (costo 12); bloqueo de 15 minutos tras 5 fallos seguidos; mensaje igual para correo inexistente, contraseña errónea o cuenta bloqueada; comparación contra un hash falso para que el tiempo de respuesta no delate los correos registrados.
- Recuperación: enlace de un solo uso que vence en 1 hora; solo se guarda su huella (SHA-256); la respuesta es la misma exista o no la cuenta.
- Rutas de API: cuerpo validado con Zod y origen comprobado (defensa contra CSRF); cookies `HttpOnly` y `SameSite=Lax`.
- Pagos: ningún dato de tarjeta pasa por la tienda; el webhook se autoriza solo por su firma; las llaves van en variables del servidor.
- Límite de peticiones en pedidos, reintentos, seguimiento, ingreso, registro y recuperación (en memoria: ver pendientes).
- Redirecciones solo a rutas del propio sitio.

## Qué no se tocó

Catálogo, búsqueda y fichas, salvo conectar los botones de compra. No hay panel de administración todavía.

## Para validar con el dueño

- **Supuestos nuevos:** reserva de 15 minutos; máximo 10 unidades por producto en un pedido; la factura queda con NIT o CF y el nombre (sin FEL); bloqueo de cuenta de 5 intentos y 15 minutos.
- **Datos de ejemplo por reemplazar** (el seed los crea para poder probar): 22 tarifas de envío por departamento (Q 35 a Q 85) y una "Tienda de ejemplo" para recoger con dirección y horario como marcadores. El dueño las cambia en el panel (fase 4).
- **Textos propuestos:** mensajes del checkout, de error de pago, de la confirmación y los correos.
- **Marcadores:** `[Dirección de la tienda]`, `[Horario de atención]`, y el remitente de los correos (`EMAIL_FROM`).

## Verificación

| Prueba | Resultado |
|---|---|
| `npm run lint`, `npm run typecheck`, `npm run build` | Sin errores ni advertencias |
| `npm test` (unitarias) | 46 pasan: dinero, disponibilidad, búsqueda, filtros, variantes, totales, estados del pedido y validación del checkout |
| `npm run test:integration` (contra PostgreSQL) | 18 pasan: crear pedido con reserva; pago aprobado, rechazado y pendiente; reintento; webhook duplicado; pago aprobado que no degrada; monto distinto; expiración; pago tardío con y sin stock; dos compradores por la última unidad; precio cambiado; reemplazo de intento anterior; tarifa de envío |
| `npm run test:e2e` (Playwright, escritorio y móvil) | 20 pasan: compra completa como invitado con seguimiento, acceso restringido, pago rechazado con reintento, pago pendiente que se actualiza solo, validación del checkout, registro, direcciones, bloqueo de cuenta, fusión del carrito, cambio de contraseña y pedido en la cuenta |
| axe (WCAG 2 A/AA, 2.1 AA, 2.2 AA y buenas prácticas) | 0 violaciones en 34 combinaciones de página, ancho y estado (cajón, carrito, cinco pasos del checkout con errores, pago, confirmación, seguimiento, ingreso, registro, recuperación) |
| Recuperación de contraseña, de punta a punta | Funciona: misma respuesta para correos existentes e inexistentes, enlace de un solo uso, clave vieja rechazada |

Errores que encontré y corregí al probar: la revisión del checkout tenía una lista de definición inválida (la detectó axe); el pago simulado "volvía" con una navegación suave que no seguía la redirección de una ruta de API; un archivo de acciones exportaba una función sin `async`; el nombre y teléfono de entrega no se precargaban desde el contacto.

## Checklist: casillas pendientes y por qué

- **Límite de peticiones:** está en memoria de cada instancia; con varias instancias en Vercel cada una cuenta por separado. Para un límite global habría que usar Redis o la base de datos.
- **Cron cada 10 minutos:** el plan gratuito de Vercel solo permite cron diario. No es un problema para el stock porque además se expira al consultar el carrito o crear un pedido, pero conviene un plan que permita el intervalo.
- **Cabecera CSP:** va en la fase 5.
- **Correos reales:** necesitan `RESEND_API_KEY` y un dominio verificado en `EMAIL_FROM`; hasta entonces se imprimen en la consola.
- **Formulario embebido de la pasarela:** el proveedor simulado usa redirección. Si la pasarela real usa formulario embebido (`kind: 'embedded'`), hay que construir esa pantalla en la fase 6.
- **Páginas informativas y legales** (`/envios`, `/garantias`, `/terminos`…): fase 5.

## Sugerencias fuera de alcance (no construidas)

- Guardar tarjetas o pagos recurrentes.
- Avisar por correo cuando un pedido pendiente por mucho tiempo expire.
- Recompra con un clic desde el historial.

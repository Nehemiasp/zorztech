# Fase 4: administración. Reporte de entrega

Punto de revisión 4 del estándar Lumacode v2. Capturas en `docs/capturas/fase4-*` (360 y 1440 px).

## Qué se hizo

El panel está en `/admin` y solo lo ven personas con rol de administrador. El dueño carga productos, inventario y datos de la tienda, y gestiona pedidos sin tocar código.

| Módulo | Qué permite |
|---|---|
| **Resumen** | Pedidos y pagos de hoy, pendientes de pago, pedidos por preparar o enviar, productos con poco stock, y un recuadro rojo con **pagos que necesitan revisión** (cobros sobre pedidos expirados o con alertas). Avisa mientras queden productos, tarifas o tienda de ejemplo. |
| **Pedidos** | Lista con filtros por estado y fechas (en hora de Guatemala) y búsqueda por código, correo o nombre. Detalle con productos, cliente, entrega, pago, historial completo con quién hizo cada cambio y notas internas. Botones para cambiar de estado; cancelar y reembolsar piden confirmación. Marcar como pagado a mano (depósito). Exportación a **CSV** con los mismos filtros. |
| **Productos** | Lista con búsqueda por nombre o SKU y filtros de categoría, estado, stock bajo y "de ejemplo". Formulario con datos básicos, marca (existente o nueva), especificaciones (pares clave y valor), variantes (SKU, precio, precio anterior, stock, mínimo, atributos para los filtros, activa), imágenes con orden, texto alternativo y variante asignada, y visibilidad (activo, destacado, ejemplo). Recalcula solo el texto de búsqueda. |
| **Categorías** | Crear, editar, ordenar (subir y bajar), activar, imagen y borrar si están vacías; un solo nivel de subcategorías. |
| **Clientes** | Lista con pedidos y compras pagadas, y detalle con pedidos y direcciones. |
| **Cupones** | Porcentaje o monto fijo, compra mínima, vigencia, límite de usos y activo. Se aplican en el carrito (con aviso si ya no valen), el descuento se calcula en el servidor, el uso se cuenta al crear el pedido y se devuelve si el pedido se cancela o vence. |
| **Configuración** | Contacto (teléfono, correo, horario, redes, formas de pago), banner del inicio con foto, tarifas de envío de los 22 departamentos (un departamento sin tarifa solo ofrece recogida), tiendas para recoger y mínimo de stock por defecto. Lo que se guarda aparece en la tienda; lo que falta sigue como marcador. |
| **"Avisarme cuando llegue"** | En una variante agotada la ficha pide el correo. Al reponer stock desde el panel (o cancelar un pedido pagado) se avisa una sola vez. |

## Decisiones (máximo 5 líneas)

1. Cada página y cada acción del panel vuelve a pedir el rol de administrador al servidor y a la base de datos; el `layout` no basta porque no se vuelve a ejecutar al navegar. A quien no es administrador el panel le responde 404.
2. Los cambios de estado del panel usan la misma función que el webhook de pagos, así que inventario, cupones, historial y correos se comportan igual en ambos caminos.
3. Lo que ya se vendió nunca se borra: una variante, tienda o cupón con pedidos se desactiva y el historial queda intacto.
4. Un producto de ejemplo no se indexa ni entra al sitemap; el panel lo marca y lo filtra.
5. Las imágenes se suben a Vercel Blob; sin token, solo en desarrollo, se guardan en disco. Se valida el tipo real por los bytes del archivo (no por la extensión), el tamaño (5 MB) y el origen de la petición.

## Seguridad aplicada

- Rol leído de la base en cada petición del panel, también en acciones, subida de imágenes y exportación (probado: un cliente recibe 404 o 403 en todo).
- Acciones con Zod; la subida rechaza SVG, HTML o cualquier archivo que no sea JPG, PNG, WebP o AVIF aunque se llame `.png`.
- Solo se aceptan imágenes propias (subidas desde el panel o de Vercel Blob) en productos, categorías y banner: no hay enlaces a sitios ajenos.
- El CSV neutraliza celdas que Excel leería como fórmulas (`=`, `+`, `-`, `@`).
- Los códigos de cupón se prueban con límite de peticiones; el uso se cuenta con bloqueo de fila, así que dos compradores no pueden pasarse del límite.
- Enlaces del banner: solo rutas de la tienda o `https`.
- `npm audit` de producción: 0 vulnerabilidades (se fijó `@vercel/blob@2.4.0`, la última sin la copia vulnerable de `zod` anidada).

## Qué no se tocó

El flujo de compra, salvo agregar el cupón al carrito y al total. El diseño de la tienda, salvo que el pie, la franja de confianza y el banner leen ahora los datos de Configuración.

## Para validar con el dueño

- **Datos de ejemplo por reemplazar:** 12 productos, 22 tarifas de envío, una "Tienda de ejemplo" y el cupón `EJEMPLO10` (10 % desde Q 100). El resumen del panel lo recuerda hasta que se retiren.
- **Supuestos nuevos:** un solo nivel de subcategorías; máximo 10 direcciones por cuenta; imágenes de hasta 5 MB; el dato de "mínimo de stock" se propone en variantes nuevas.
- **Textos propuestos:** mensajes del panel, correo de "ya llegó" y de reembolso.
- **Administrador inicial:** se crea con el seed si se definen `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`. En producción hay que usar una contraseña propia y cambiarla al entrar.

## Verificación

| Prueba | Resultado |
|---|---|
| `npm run lint`, `npm run typecheck`, `npm run build` | Sin errores ni advertencias |
| `npm test` (unitarias) | 86 pasan (se suman: CSV, fechas de Guatemala, cupones, esquemas del panel, imágenes, slugs, precios en quetzales, estados) |
| `npm run test:integration` | 32 pasan (se suman 14 del panel: estados paso a paso, cancelar devuelve unidades, reembolso por el proveedor, pago manual, pago tardío sin stock, cupones con límite de uso y devolución, guardar productos, SKU repetido, stock bajo lo apartado, variante vendida, aviso de reposición una sola vez) |
| `npm run test:e2e` (escritorio y móvil) | 42 pasan (se suman 22 del panel: permisos, pedido de pagado a entregado con nota y CSV, cancelación con confirmación, crear producto y verlo en la tienda, SKU repetido, categorías, subida de imágenes, cupón de punta a punta, configuración visible en la tienda, aviso de stock) |
| axe (WCAG 2.2 AA y buenas prácticas) | 0 violaciones en las 15 pantallas del panel (360 y 1440 px) y en 14 estados de la tienda |
| Scroll horizontal | Ninguno en las 15 pantallas del panel × 4 anchos (360, 768, 1024, 1440) |

Errores que encontré y corregí al probar: una función de cliente llamada desde el servidor hacía caer el formulario de productos; el panel desbordaba a 360 px (barra de navegación, textos `sr-only` dentro de tablas con scroll y columnas de la rejilla que no podían encogerse); los mensajes de éxito desaparecían cuando la acción dejaba el pedido en estado final o borraba la categoría; las tablas anchas no se podían recorrer con teclado (ahora son regiones con nombre y foco); las etiquetas que envolvían un `<select>` ponían todas las opciones en su nombre accesible (ahora llevan etiqueta propia); una URL de ingreso con `/admin` hacía creer a mi prueba que ya había entrado.

## Checklist: casillas pendientes y por qué

- **Cabecera CSP:** fase 5.
- **Correos reales:** necesitan `RESEND_API_KEY` y `EMAIL_FROM`.
- **Almacenamiento de imágenes en producción:** necesita `BLOB_READ_WRITE_TOKEN`.
- **Edición de marcas:** se crean desde el formulario del producto; renombrarlas o borrarlas no está en el panel.
- **Cambio de correo de una cuenta y borrado de clientes:** no están; se piden por contacto (fuera de alcance).

## Sugerencias fuera de alcance (no construidas)

- Importar productos desde una hoja de cálculo.
- Gráficas de ventas por periodo.
- Roles intermedios (por ejemplo, alguien que solo prepare pedidos).

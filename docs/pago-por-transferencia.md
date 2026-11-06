# Pago por transferencia bancaria

Forma de pago manual: no necesita proveedor ni API. El cliente deposita en la cuenta de la tienda y una persona confirma el pago desde el panel.

## Cómo se activa

1. Entra a **Panel → Configuración → Pago por transferencia**.
2. Escribe el banco, el titular y el número de cuenta (tipo de cuenta e indicaciones son opcionales).
3. Marca **Ofrecer pago por transferencia** y guarda.

Mientras esté desactivada, o falte alguno de los tres datos obligatorios, la opción no aparece en el pago. Desmarcarla la oculta sin borrar los datos.

## Qué ve el cliente

1. En el paso **Pago** elige «Transferencia bancaria». El botón final dice «Confirmar pedido Q …», no «Pagar».
2. La tienda crea el pedido en estado **Pendiente de pago**, aparta los productos y vacía el carrito.
3. La confirmación muestra la cuenta, el monto exacto y la **referencia** (el código del pedido), con botones para copiar. Recibe lo mismo por correo.
4. Si prefiere otra forma de pago, el botón «Prefiero pagar de otra forma» abre un pago con el proveedor.

### Comprobante y enlace al pedido

- En la confirmación (y en **Mi cuenta → Mis pedidos → el pedido**, si tiene sesión) hay un recuadro para **subir una foto o captura del comprobante**. Es opcional; se admiten hasta 3, en JPG, PNG o WebP de hasta 3 MB (las fotos grandes se reducen antes de subirlas).
- Los comprobantes se guardan en el registro del pago, dentro de la base de datos, y **no son públicos**: solo los ve quien tiene acceso al pedido (el cliente o un administrador).
- La confirmación muestra un **enlace directo al pedido** que se puede copiar. También va en los correos. Con ese enlace se ve el pedido y se sube el comprobante desde cualquier dispositivo, sin iniciar sesión. Solo sirve para ese pedido; quien lo tenga puede verlo, por eso se pide no compartirlo.

## Qué hace la persona que administra

1. Cuando el dinero aparezca en la cuenta, entra a **Panel → Pedidos →** el pedido (la referencia es su código).
2. Si el cliente subió comprobante, lo ves en el panel del pago (con vista previa) y en la lista de pedidos aparece «Con comprobante». Compara el monto y la referencia.
3. Pulsa **Marcar como pagado** y confirma. El pedido pasa a **Pagado**, se descuenta el stock, el pago queda aprobado y el cliente recibe el correo de pago.
4. Desde ahí sigue el flujo normal: preparar, enviar y entregar.

## Cuánto se aparta el pedido

Por defecto, **24 horas** (se cambia en la misma sección, de 1 a 168 horas). Pasado ese tiempo sin pago, el pedido vence y los productos vuelven a estar disponibles.

Si el dinero llega después de vencer, el pedido aún se puede marcar como pagado mientras haya stock; si ya no hay, el panel avisa y hay que devolver el dinero o conseguir las unidades.

## Notas

- Los datos de la cuenta son públicos para quien compra: usa una cuenta de la tienda.
- La tienda no verifica el depósito ni lee el banco: la confirmación es siempre manual.
- Un pedido por transferencia no tiene reembolso automático: el panel lo registra y el dinero se devuelve fuera de la tienda.

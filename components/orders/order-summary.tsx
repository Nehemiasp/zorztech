import { Marker } from "@/components/marker";
import { formatGTQ } from "@/lib/money";
import { readShippingAddress, type OrderDetail } from "@/lib/orders/queries";

/** Productos, totales y datos de entrega de un pedido. */
export function OrderSummary({ order }: { order: OrderDetail }) {
  const address = readShippingAddress(order.shippingAddress);
  return (
    <div className="space-y-6">
      <section aria-labelledby="productos-pedido">
        <h2 id="productos-pedido" className="text-lg">
          Productos
        </h2>
        <ul className="mt-2 divide-y divide-border">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="font-medium">{item.productName}</p>
                {item.variantName && <p className="text-sm text-text-muted">{item.variantName}</p>}
                <p className="text-sm text-text-muted">
                  {item.quantity} × {formatGTQ(item.unitPrice)}
                </p>
              </div>
              <p className="shrink-0 font-medium">{formatGTQ(item.unitPrice * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-1 border-t border-border pt-3">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatGTQ(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <dt>Descuento</dt>
              <dd>-{formatGTQ(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Envío</dt>
            <dd>{order.shippingCost > 0 ? formatGTQ(order.shippingCost) : "Sin costo"}</dd>
          </div>
          <div className="flex justify-between text-lg font-medium">
            <dt>Total</dt>
            <dd>{formatGTQ(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="entrega-pedido">
        <h2 id="entrega-pedido" className="text-lg">
          {order.shippingMethod === "domicilio" ? "Envío a domicilio" : "Recoger en tienda"}
        </h2>
        {order.shippingMethod === "domicilio" && address ? (
          <p className="mt-2 text-text-muted">
            {address.nombre}
            <br />
            {address.direccion}, {address.municipio}, {address.departamento}
            {address.referencia && (
              <>
                <br />
                Referencia: {address.referencia}
              </>
            )}
            <br />
            Teléfono: {address.telefono}
          </p>
        ) : order.pickupLocation ? (
          <p className="mt-2 text-text-muted">
            {order.pickupLocation.name}
            <br />
            {order.pickupLocation.address.startsWith("[") ? <Marker>{order.pickupLocation.address}</Marker> : order.pickupLocation.address}
            <br />
            Horario: {order.pickupLocation.hours.startsWith("[") ? <Marker>{order.pickupLocation.hours}</Marker> : order.pickupLocation.hours}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="factura-pedido">
        <h2 id="factura-pedido" className="text-lg">
          Factura
        </h2>
        <p className="mt-2 text-text-muted">
          {order.taxName} · NIT {order.taxId}
        </p>
      </section>
    </div>
  );
}

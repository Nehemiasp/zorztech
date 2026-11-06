/** Envío a domicilio: una tarifa general para todo el país y gratis desde cierto monto de compra. Montos en centavos. */
export interface ShippingSettings {
  /** Costo del envío a domicilio. */
  flatRate: number;
  /** Compra (ya con descuentos) desde la que el envío es gratis. 0 significa que no hay envío gratis. */
  freeFrom: number;
  /** Texto libre para el tiempo de entrega, por ejemplo «2 a 4 días hábiles». Vacío si el dueño aún no lo define. */
  deliveryTime: string;
}

/** Valores de partida: Q 35.00 de envío y gratis desde Q 400.00. El dueño los cambia en el panel. */
export const defaultShipping: ShippingSettings = { flatRate: 3500, freeFrom: 40000, deliveryTime: "" };

const offersFreeShipping = (s: ShippingSettings) => s.freeFrom > 0;

/** Costo del envío a domicilio para una compra. `goodsTotal` es subtotal menos descuento. La recogida en tienda no pasa por aquí: no cuesta. */
export function homeShippingCost(goodsTotal: number, s: ShippingSettings): number {
  return offersFreeShipping(s) && goodsTotal >= s.freeFrom ? 0 : s.flatRate;
}

/** Cuánto le falta a la compra para el envío gratis. 0 si ya lo tiene o si no se ofrece. */
export function amountToFreeShipping(goodsTotal: number, s: ShippingSettings): number {
  return offersFreeShipping(s) ? Math.max(s.freeFrom - goodsTotal, 0) : 0;
}

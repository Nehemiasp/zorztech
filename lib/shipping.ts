/** Envío a domicilio: una tarifa general para todo el país y gratis desde cierto monto de compra. Montos en centavos. */
export interface ShippingSettings {
  /** Costo del envío a domicilio. */
  flatRate: number;
  /** Compra (ya con descuentos) desde la que el envío es gratis. 0 significa que no hay envío gratis. */
  freeFrom: number;
  /** Texto libre para el tiempo de entrega. Vacío: la tienda muestra un marcador. */
  deliveryTime: string;
}

/** Valores de partida: Q 55.00 de envío, gratis desde Q 400.00 y entrega de 1 a 2 días. El dueño los cambia en el panel. */
export const defaultShipping: ShippingSettings = {
  flatRate: 5500,
  freeFrom: 40000,
  deliveryTime: "1 a 2 días; puede variar según el lugar de envío",
};

/** Texto como oración: sin punto final repetido. */
export const asSentence = (text: string) => `${text.trim().replace(/[.\s]+$/, "")}.`;

const offersFreeShipping = (s: ShippingSettings) => s.freeFrom > 0;

/** Costo del envío a domicilio para una compra. `goodsTotal` es subtotal menos descuento. La recogida en tienda no pasa por aquí: no cuesta. */
export function homeShippingCost(goodsTotal: number, s: ShippingSettings): number {
  return offersFreeShipping(s) && goodsTotal >= s.freeFrom ? 0 : s.flatRate;
}

/** Cuánto le falta a la compra para el envío gratis. 0 si ya lo tiene o si no se ofrece. */
export function amountToFreeShipping(goodsTotal: number, s: ShippingSettings): number {
  return offersFreeShipping(s) ? Math.max(s.freeFrom - goodsTotal, 0) : 0;
}

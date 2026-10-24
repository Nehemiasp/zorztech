export interface PricedLine {
  unitPrice: number;
  quantity: number;
}

export interface Totals {
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
}

/**
 * Totales de un pedido, en centavos. Se calculan siempre en el servidor con los precios de la base:
 * el navegador nunca manda precios. El descuento nunca supera el subtotal (el envío no se descuenta).
 */
export function calculateTotals(lines: PricedLine[], shippingCost: number, discount = 0): Totals {
  for (const n of [shippingCost, discount, ...lines.flatMap((l) => [l.unitPrice, l.quantity])]) {
    if (!Number.isInteger(n) || n < 0) throw new Error("Los montos deben ser enteros no negativos (centavos)");
  }
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const applied = Math.min(discount, subtotal);
  return { subtotal, shippingCost, discount: applied, total: subtotal - applied + shippingCost };
}

/** Descuento de un cupón sobre un subtotal, redondeado hacia abajo al centavo. */
export function couponDiscount(type: "porcentaje" | "monto", value: number, subtotal: number): number {
  const raw = type === "porcentaje" ? Math.floor((subtotal * value) / 100) : value;
  return Math.min(Math.max(raw, 0), subtotal);
}

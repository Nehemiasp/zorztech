// Todos los montos son enteros en centavos de quetzal: Q 1,299.00 = 129900.

const formatter = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" });

export function formatGTQ(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error(`El monto debe ser un entero en centavos, recibí ${cents}`);
  }
  return formatter.format(cents / 100);
}

/** Porcentaje de ahorro entero entre un precio anterior y el actual. */
export function discountPercent(compareAtPrice: number, price: number): number {
  if (compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

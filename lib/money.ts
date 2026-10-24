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

/**
 * Lee un precio escrito por una persona en quetzales ("1299", "1,299.50", "Q 12.5") y lo devuelve en
 * centavos. Devuelve null si no es un monto válido (más de dos decimales, texto, negativo).
 */
export function parseGTQ(input: string): number | null {
  const cleaned = input.trim().replace(/^Q\s*/i, "").replace(/\s/g, "");
  if (!/^\d{1,3}(,\d{3})*(\.\d{1,2})?$|^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, decimals = ""] = cleaned.replace(/,/g, "").split(".");
  return Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
}

/** Centavos como texto editable: 129900 → "1299.00". */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

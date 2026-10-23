export type Availability = "disponible" | "ultimas" | "agotado";

export interface StockInfo {
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
}

/** Unidades que se pueden vender ahora: lo que hay menos lo reservado por pedidos sin pagar. */
export function availableUnits(v: Pick<StockInfo, "stock" | "reservedStock">): number {
  return Math.max(0, v.stock - v.reservedStock);
}

/**
 * Disponibilidad de un producto a partir de sus variantes activas.
 * "Últimas unidades" solo aparece cuando el stock real es bajo en todas las variantes que se pueden comprar.
 */
export function productAvailability(variants: StockInfo[]): Availability {
  const sellable = variants.filter((v) => availableUnits(v) > 0);
  if (sellable.length === 0) return "agotado";
  const allLow = sellable.every((v) => availableUnits(v) <= v.lowStockThreshold);
  return allLow ? "ultimas" : "disponible";
}

export const availabilityLabel: Record<Availability, string> = {
  disponible: "Disponible",
  ultimas: "Últimas unidades",
  agotado: "Agotado",
};

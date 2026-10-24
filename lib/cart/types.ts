/** Tipos del carrito que comparten el servidor y el navegador. Sin imports del servidor. */

export type CartIssue = "precio_cambio" | "stock_insuficiente" | "agotado" | "no_disponible";

export interface CartLine {
  id: string;
  variantId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  sku: string;
  image: { url: string; alt: string } | null;
  unitPrice: number;
  /** Precio que el cliente vio al agregar el producto. */
  priceAtAdd: number;
  quantity: number;
  /** Unidades que se pueden comprar ahora. */
  available: number;
  lineTotal: number;
  issues: CartIssue[];
}

export interface CartView {
  lines: CartLine[];
  /** Número de unidades en el carrito. */
  count: number;
  subtotal: number;
  /** Hay productos que impiden pagar (sin stock, sin existencias suficientes o retirados). */
  blocking: boolean;
  priceChanged: boolean;
}

export const emptyCart: CartView = { lines: [], count: 0, subtotal: 0, blocking: false, priceChanged: false };

export const issueMessage: Record<CartIssue, string> = {
  precio_cambio: "El precio cambió desde que lo agregaste.",
  stock_insuficiente: "No hay unidades suficientes para tu cantidad.",
  agotado: "Este producto se agotó.",
  no_disponible: "Este producto ya no está disponible.",
};

/** Máximo de unidades de una misma variante en un pedido. */
export const MAX_PER_LINE = 10;

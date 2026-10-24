import { db } from "../db";
import { availableUnits } from "../availability";
import { sweepIfDue } from "../orders/expiry";
import { emptyCart, type CartIssue, type CartLine, type CartView } from "./types";

const lineSelect = {
  id: true,
  variantId: true,
  quantity: true,
  priceAtAdd: true,
  variant: {
    select: {
      sku: true,
      name: true,
      price: true,
      stock: true,
      reservedStock: true,
      isActive: true,
      product: {
        select: {
          name: true,
          slug: true,
          isActive: true,
          category: { select: { isActive: true } },
          images: { where: { variantId: null }, orderBy: { order: "asc" as const }, take: 1, select: { url: true, alt: true } },
        },
      },
    },
  },
} as const;

/** Estado actual de un carrito con precios y stock reales, y los avisos que corresponden. */
export async function loadCartView(cartId: string | null): Promise<CartView> {
  if (!cartId) return emptyCart;
  await sweepIfDue();
  const items = await db.cartItem.findMany({ where: { cartId }, orderBy: { id: "asc" }, select: lineSelect });

  const lines: CartLine[] = items.map((item) => {
    const v = item.variant;
    const sellable = v.isActive && v.product.isActive && v.product.category.isActive;
    const available = sellable ? availableUnits(v) : 0;
    const issues: CartIssue[] = [];
    if (!sellable) issues.push("no_disponible");
    else if (available <= 0) issues.push("agotado");
    else if (item.quantity > available) issues.push("stock_insuficiente");
    if (sellable && v.price !== item.priceAtAdd) issues.push("precio_cambio");
    return {
      id: item.id,
      variantId: item.variantId,
      productName: v.product.name,
      productSlug: v.product.slug,
      variantName: v.name,
      sku: v.sku,
      image: v.product.images[0] ?? null,
      unitPrice: v.price,
      priceAtAdd: item.priceAtAdd,
      quantity: item.quantity,
      available,
      lineTotal: v.price * item.quantity,
      issues,
    };
  });

  return {
    lines,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    subtotal: lines.reduce((n, l) => n + l.lineTotal, 0),
    blocking: lines.some((l) => l.issues.some((i) => i !== "precio_cambio")),
    priceChanged: lines.some((l) => l.issues.includes("precio_cambio")),
  };
}


export async function clearCartItems(cartId: string): Promise<void> {
  await db.cartItem.deleteMany({ where: { cartId } });
}

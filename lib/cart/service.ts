import { cookies } from "next/headers";
import { db } from "../db";
import { evaluateCoupon, normalizeCouponCode } from "../coupons";
import { availableUnits } from "../availability";
import { getCurrentUser } from "../auth";
import { randomToken } from "../security";
import { MAX_PER_LINE, emptyCart, type CartView } from "./types";
import { loadCartView } from "./view";

const COOKIE = "zt_carrito";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

export class CartError extends Error {
  constructor(
    public code: "no_disponible" | "agotado" | "no_encontrado",
    message: string,
  ) {
    super(message);
  }
}

async function mergeCarts(fromId: string, intoId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const items = await tx.cartItem.findMany({ where: { cartId: fromId } });
    for (const item of items) {
      const existing = await tx.cartItem.findUnique({ where: { cartId_variantId: { cartId: intoId, variantId: item.variantId } } });
      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: Math.min(existing.quantity + item.quantity, MAX_PER_LINE) },
        });
      } else {
        await tx.cartItem.create({
          data: { cartId: intoId, variantId: item.variantId, quantity: item.quantity, priceAtAdd: item.priceAtAdd },
        });
      }
    }
    await tx.cart.delete({ where: { id: fromId } });
  });
}

/**
 * Carrito de quien visita: el de su cuenta si inició sesión, si no el de su cookie.
 * Al iniciar sesión, el carrito de invitado se combina con el de la cuenta.
 */
export async function resolveCart(create: boolean): Promise<{ id: string } | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  const [user, guest] = await Promise.all([
    getCurrentUser(),
    token ? db.cart.findUnique({ where: { sessionId: token }, select: { id: true } }) : null,
  ]);

  if (user) {
    let cart = await db.cart.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!cart && (create || guest)) cart = await db.cart.create({ data: { userId: user.id }, select: { id: true } });
    if (cart && guest && guest.id !== cart.id) {
      await mergeCarts(guest.id, cart.id);
      try {
        jar.delete(COOKIE);
      } catch {
        // En un componente de servidor no se pueden tocar cookies; el carrito de invitado ya no existe.
      }
    }
    return cart;
  }

  if (guest) return guest;
  if (!create) return null;
  const sessionId = randomToken(24);
  const cart = await db.cart.create({ data: { sessionId }, select: { id: true } });
  jar.set(COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return cart;
}

export async function getCartView(): Promise<CartView> {
  const cart = await resolveCart(false);
  return loadCartView(cart?.id ?? null);
}

export interface CartChange {
  cart: CartView;
  /** Mensaje para el cliente cuando se ajustó lo que pidió. */
  notice?: string;
}

export async function addToCart(variantId: string, quantity: number): Promise<CartChange> {
  const variant = await db.productVariant.findFirst({
    where: { id: variantId, isActive: true, product: { isActive: true, category: { isActive: true } } },
    select: { id: true, price: true, stock: true, reservedStock: true },
  });
  if (!variant) throw new CartError("no_disponible", "Este producto ya no está disponible.");
  const available = availableUnits(variant);
  if (available <= 0) throw new CartError("agotado", "Este producto está agotado.");

  const cart = await resolveCart(true);
  if (!cart) throw new CartError("no_encontrado", "No pudimos abrir tu carrito.");

  const existing = await db.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } } });
  const desired = (existing?.quantity ?? 0) + quantity;
  const final = Math.min(desired, available, MAX_PER_LINE);

  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity: final, priceAtAdd: variant.price },
    create: { cartId: cart.id, variantId, quantity: final, priceAtAdd: variant.price },
  });

  const notice =
    final < desired
      ? final === MAX_PER_LINE && available > MAX_PER_LINE
        ? `Puedes comprar hasta ${MAX_PER_LINE} unidades de este producto por pedido.`
        : `Solo hay ${available} ${available === 1 ? "unidad disponible" : "unidades disponibles"}. Ajustamos tu cantidad.`
      : undefined;
  return { cart: await loadCartView(cart.id), notice };
}

async function ownedItem(itemId: string) {
  const cart = await resolveCart(false);
  if (!cart) return null;
  const item = await db.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    select: { id: true, cartId: true, variantId: true },
  });
  return item ? { item, cartId: cart.id } : null;
}

export async function setQuantity(itemId: string, quantity: number): Promise<CartChange> {
  const owned = await ownedItem(itemId);
  if (!owned) throw new CartError("no_encontrado", "Ese producto ya no está en tu carrito.");
  const variant = await db.productVariant.findUnique({
    where: { id: owned.item.variantId },
    select: { price: true, stock: true, reservedStock: true },
  });
  const available = variant ? availableUnits(variant) : 0;
  const final = Math.max(1, Math.min(quantity, available || 1, MAX_PER_LINE));
  await db.cartItem.update({ where: { id: itemId }, data: { quantity: final } });
  const notice =
    available > 0 && quantity > final && final < MAX_PER_LINE
      ? `Solo hay ${available} ${available === 1 ? "unidad disponible" : "unidades disponibles"}.`
      : quantity > MAX_PER_LINE
        ? `Puedes comprar hasta ${MAX_PER_LINE} unidades de este producto por pedido.`
        : undefined;
  return { cart: await loadCartView(owned.cartId), notice };
}

export async function removeItem(itemId: string): Promise<CartChange> {
  const owned = await ownedItem(itemId);
  if (!owned) return { cart: await getCartView() };
  await db.cartItem.delete({ where: { id: itemId } });
  return { cart: await loadCartView(owned.cartId) };
}

/** El cliente vio los precios nuevos: se toman como los vigentes y el aviso desaparece. */
export async function confirmPrices(): Promise<CartChange> {
  const cart = await resolveCart(false);
  if (!cart) return { cart: emptyCart };
  await db.$executeRaw`
    UPDATE cart_items ci SET "priceAtAdd" = v.price
    FROM product_variants v WHERE v.id = ci."variantId" AND ci."cartId" = ${cart.id}`;
  return { cart: await loadCartView(cart.id) };
}

export type CouponResult = { ok: true; change: CartChange } | { ok: false; message: string };

/** Aplica un cupón al carrito si es válido para su subtotal actual. */
export async function applyCoupon(rawCode: string): Promise<CouponResult> {
  const code = normalizeCouponCode(rawCode);
  if (!code) return { ok: false, message: "Escribe el código del cupón." };
  const cart = await resolveCart(false);
  const view = await loadCartView(cart?.id ?? null);
  if (!cart || view.lines.length === 0) return { ok: false, message: "Agrega productos a tu carrito antes de usar un cupón." };

  const coupon = await db.coupon.findUnique({ where: { code } });
  const check = evaluateCoupon(coupon, view.subtotal);
  if (!check.ok) return { ok: false, message: check.message };

  await db.cart.update({ where: { id: cart.id }, data: { couponCode: code } });
  return { ok: true, change: { cart: await loadCartView(cart.id), notice: "Aplicamos tu cupón." } };
}

export async function removeCoupon(): Promise<CartChange> {
  const cart = await resolveCart(false);
  if (!cart) return { cart: emptyCart };
  await db.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
  return { cart: await loadCartView(cart.id) };
}

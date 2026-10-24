import { db } from "../db";
import { loadCartView } from "../cart/view";
import { evaluateCoupon } from "../coupons";
import type { CheckoutInput } from "../checkout/schema";
import { Prisma, type Order } from "../generated/prisma/client";
import { getPaymentProvider } from "../payments";
import type { CreatePaymentResult } from "../payments/types";
import { formatGTQ } from "../money";
import { siteConfig } from "../site";
import { generateOrderCode } from "./code";
import { expireStaleReservations } from "./expiry";
import { applyTransition } from "./lifecycle";
import { reservedStatuses } from "./status";
import { calculateTotals } from "./totals";

/** Minutos que se aparta el stock mientras el cliente paga. */
export const RESERVATION_MINUTES = 15;

export type PaymentRedirect = { kind: "redirect"; url: string } | { kind: "embedded"; clientToken: string };

export type CreateOrderResult =
  | { ok: true; code: string; payment: PaymentRedirect }
  | {
      ok: false;
      error: "carrito_vacio" | "carrito_con_problemas" | "sin_tarifa" | "sin_tienda" | "sin_stock" | "total_cambio" | "cupon" | "pago";
      message: string;
      /** El pedido ya existe y puede reintentarse (el proveedor falló al iniciar el pago). */
      code?: string;
    };

class TotalChanged extends Error {
  constructor(public total: number) {
    super("total");
  }
}

class CouponProblem extends Error {}

class StockShortage extends Error {
  constructor(public productName: string) {
    super(productName);
  }
}

const reservationEnd = () => new Date(Date.now() + RESERVATION_MINUTES * 60_000);

function storedRedirect(raw: unknown): PaymentRedirect | null {
  const value = (raw as { checkout?: PaymentRedirect } | null)?.checkout;
  return value && (value.kind === "redirect" || value.kind === "embedded") ? value : null;
}

/** Inicia un pago para un pedido y lo registra. Devuelve lo que el navegador necesita para continuar. */
async function startPayment(order: Pick<Order, "id" | "code" | "total" | "email" | "customerName" | "phone">, attempt: number, baseKey: string) {
  const provider = getPaymentProvider();
  const idempotencyKey = `${baseKey}:${attempt}`;
  const existing = await db.payment.findUnique({ where: { idempotencyKey } });
  const saved = existing && storedRedirect(existing.rawResponse);
  if (saved) return { ok: true as const, payment: saved };

  let result: CreatePaymentResult;
  try {
    result = await provider.createPayment({
      orderId: order.id,
      orderCode: order.code,
      amount: order.total,
      currency: "GTQ",
      customer: { email: order.email, name: order.customerName, phone: order.phone },
      returnUrl: `${siteConfig.url}/api/payments/return?codigo=${encodeURIComponent(order.code)}`,
      cancelUrl: `${siteConfig.url}/pedido/${encodeURIComponent(order.code)}/confirmacion`,
      idempotencyKey,
    });
  } catch (error) {
    result = { kind: "error", message: error instanceof Error ? error.message : "Error del proveedor" };
  }

  if (result.kind === "error") {
    await db.payment.create({
      data: {
        orderId: order.id,
        provider: provider.id,
        providerRef: `ERR-${idempotencyKey}`,
        status: "error",
        amount: order.total,
        idempotencyKey,
        rawResponse: { error: result.message },
      },
    });
    await db.orderEvent.create({ data: { orderId: order.id, type: "pago", note: `No se pudo iniciar el pago: ${result.message}` } });
    return { ok: false as const };
  }

  const checkout: PaymentRedirect =
    result.kind === "redirect" ? { kind: "redirect", url: result.url } : { kind: "embedded", clientToken: result.clientToken };
  await db.payment.create({
    data: {
      orderId: order.id,
      provider: provider.id,
      providerRef: result.providerRef,
      status: "pending",
      amount: order.total,
      idempotencyKey,
      rawResponse: { checkout },
    },
  });
  return { ok: true as const, payment: checkout };
}

/** Un pedido que ya existe: se reutiliza su pago pendiente y, si no lo hay (falló al iniciar), se abre uno nuevo. */
async function resumePayment(order: Order) {
  const latest = await db.payment.findFirst({ where: { orderId: order.id }, orderBy: { createdAt: "desc" } });
  const saved = latest && latest.status === "pending" ? storedRedirect(latest.rawResponse) : null;
  if (saved) return { ok: true as const, payment: saved };
  const attempts = await db.payment.count({ where: { orderId: order.id } });
  return startPayment(order, attempts + 1, order.idempotencyKey ?? order.id);
}

const failedPayment = (code: string): CreateOrderResult => ({
  ok: false,
  error: "pago",
  code,
  message: "No pudimos iniciar el pago. Tu pedido sigue apartado unos minutos: inténtalo de nuevo.",
});

/**
 * Crea el pedido desde el carrito: calcula todo con los precios de la base, aparta el stock de forma
 * atómica y deja el pago listo. El navegador solo manda sus datos, nunca montos.
 */
export async function createOrderFromCart(input: CheckoutInput, userId: string | null, cartId: string | null): Promise<CreateOrderResult> {
  // Un reintento con la misma clave devuelve el mismo pedido y el mismo pago, sin duplicar nada.
  const repeated = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (repeated) {
    const started = await resumePayment(repeated);
    return started.ok ? { ok: true, code: repeated.code, payment: started.payment } : failedPayment(repeated.code);
  }

  await expireStaleReservations();

  const cart = cartId ? { id: cartId } : null;
  const view = await loadCartView(cart?.id ?? null);
  if (!cart || view.lines.length === 0) {
    return { ok: false, error: "carrito_vacio", message: "Tu carrito está vacío." };
  }
  if (view.blocking) {
    return { ok: false, error: "carrito_con_problemas", message: "Algunos productos de tu carrito ya no están disponibles. Revísalo antes de pagar." };
  }

  let shippingCost = 0;
  let shippingAddress: Prisma.InputJsonValue | undefined;
  let pickupLocationId: string | undefined;
  if (input.delivery.method === "domicilio") {
    const rate = await db.shippingRate.findUnique({ where: { departamento: input.delivery.departamento } });
    if (!rate) {
      return { ok: false, error: "sin_tarifa", message: `Todavía no tenemos tarifa de envío para ${input.delivery.departamento}. Elige recogida en tienda o escríbenos.` };
    }
    shippingCost = rate.price;
    const { method: _method, ...address } = input.delivery;
    void _method;
    shippingAddress = address;
  } else {
    const pickup = await db.pickupLocation.findFirst({ where: { id: input.delivery.pickupLocationId, isActive: true } });
    if (!pickup) return { ok: false, error: "sin_tienda", message: "Esa tienda ya no está disponible para recoger. Elige otra." };
    pickupLocationId = pickup.id;
  }

  const code = generateOrderCode();
  let order: Order;
  try {
    order = await db.$transaction(async (tx) => {
      // Un nuevo intento de compra reemplaza al anterior sin pagar del mismo carrito y le devuelve su stock.
      const previous = await tx.order.findMany({ where: { cartId: cart.id, status: { in: reservedStatuses } }, select: { id: true } });
      for (const p of previous) {
        await applyTransition(tx, p.id, "cancelado", { note: "Reemplazado por un nuevo intento de compra." });
      }

      // Se leen los precios dentro de la transacción: lo que se cobra es lo que hay en la base en este momento.
      const items = await tx.cartItem.findMany({
        where: { cartId: cart.id },
        select: {
          variantId: true,
          quantity: true,
          variant: { select: { sku: true, name: true, price: true, product: { select: { name: true } } } },
        },
      });
      for (const item of items) {
        const reserved = await tx.$executeRaw`
          UPDATE product_variants SET "reservedStock" = "reservedStock" + ${item.quantity}
          WHERE id = ${item.variantId} AND "isActive" AND stock - "reservedStock" >= ${item.quantity}`;
        if (reserved === 0) throw new StockShortage(item.variant.product.name);
      }

      const lines = items.map((i) => ({ unitPrice: i.variant.price, quantity: i.quantity }));
      const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);

      // Cupón: se bloquea su fila, se valida con el subtotal real y se cuenta el uso en la misma transacción.
      let couponId: string | undefined;
      let discount = 0;
      const withCoupon = await tx.cart.findUnique({ where: { id: cart.id }, select: { couponCode: true } });
      if (withCoupon?.couponCode) {
        await tx.$queryRaw`SELECT id FROM coupons WHERE code = ${withCoupon.couponCode} FOR UPDATE`;
        const coupon = await tx.coupon.findUnique({ where: { code: withCoupon.couponCode } });
        const check = evaluateCoupon(coupon, subtotal);
        if (!check.ok || !coupon) throw new CouponProblem(check.ok ? "Ese cupón ya no está disponible." : check.message);
        const used = await tx.$executeRaw`
          UPDATE coupons SET "usedCount" = "usedCount" + 1
          WHERE id = ${coupon.id} AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")`;
        if (used === 0) throw new CouponProblem("Ese cupón ya se usó el máximo de veces.");
        couponId = coupon.id;
        discount = check.discount;
      }

      const totals = calculateTotals(lines, shippingCost, discount);
      if (totals.total !== input.expectedTotal) throw new TotalChanged(totals.total);
      const created = await tx.order.create({
        data: {
          code,
          customerName: input.contact.name,
          cartId: cart.id,
          idempotencyKey: input.idempotencyKey,
          userId,
          email: input.contact.email,
          phone: input.contact.phone,
          status: "pendiente_pago",
          paymentStatus: "pending",
          ...totals,
          couponId,
          shippingMethod: input.delivery.method,
          shippingAddress,
          pickupLocationId,
          taxId: input.billing.taxId,
          taxName: input.billing.taxName,
          notes: input.notes || null,
          reservationExpiresAt: reservationEnd(),
          items: {
            create: items.map((i) => ({
              variantId: i.variantId,
              productName: i.variant.product.name,
              variantName: i.variant.name,
              sku: i.variant.sku,
              unitPrice: i.variant.price,
              quantity: i.quantity,
            })),
          },
        },
      });
      await tx.orderEvent.create({
        data: { orderId: created.id, type: "creado", toStatus: "pendiente_pago", actorId: userId, note: "Pedido creado. Stock apartado mientras se paga." },
      });
      return created;
    });
  } catch (error) {
    if (error instanceof TotalChanged) {
      return {
        ok: false,
        error: "total_cambio",
        message: `El total cambió a ${formatGTQ(error.total)} porque se actualizó un precio. Revisa tu pedido y vuelve a pagar.`,
      };
    }
    if (error instanceof CouponProblem) {
      return { ok: false, error: "cupon", message: `${error.message} Revisa tu carrito: quitamos el cupón.` };
    }
    if (error instanceof StockShortage) {
      return { ok: false, error: "sin_stock", message: `Ya no hay unidades suficientes de «${error.productName}». Ajusta tu carrito e inténtalo otra vez.` };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Otra petición con la misma clave ganó la carrera: se devuelve ese pedido.
      const winner = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (winner) {
        const started = await resumePayment(winner);
        return started.ok ? { ok: true, code: winner.code, payment: started.payment } : failedPayment(winner.code);
      }
    }
    throw error;
  }

  const started = await startPayment(order, 1, input.idempotencyKey);
  return started.ok ? { ok: true, code: order.code, payment: started.payment } : failedPayment(order.code);
}

export type RetryResult =
  | { ok: true; payment: PaymentRedirect }
  | { ok: false; message: string };

/** Nuevo intento de pago de un pedido que sigue apartado (pendiente o con pago fallido). */
export async function retryPayment(code: string): Promise<RetryResult> {
  await expireStaleReservations();
  const order = await db.order.findUnique({ where: { code } });
  if (!order || !reservedStatuses.includes(order.status)) {
    return { ok: false, message: "Este pedido ya no admite un nuevo intento de pago." };
  }
  const attempts = await db.payment.count({ where: { orderId: order.id } });

  await db.$transaction(async (tx) => {
    // Cada intento renueva el apartado y, si el pago había fallado, el pedido vuelve a esperar el pago.
    await tx.order.update({ where: { id: order.id }, data: { reservationExpiresAt: reservationEnd() } });
    if (order.status === "pago_fallido") {
      await tx.order.update({ where: { id: order.id }, data: { status: "pendiente_pago", paymentStatus: "pending" } });
      await tx.orderEvent.create({
        data: { orderId: order.id, type: "estado", fromStatus: "pago_fallido", toStatus: "pendiente_pago", note: "Nuevo intento de pago." },
      });
    }
  });

  const started = await startPayment(order, attempts + 1, order.idempotencyKey ?? order.id);
  return started.ok ? { ok: true, payment: started.payment } : { ok: false, message: "No pudimos iniciar el pago. Inténtalo de nuevo en un momento." };
}

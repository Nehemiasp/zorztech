import { db } from "../db";
import { orderStatusEmail } from "../email/templates";
import { sendEmail } from "../email";
import type { OrderStatus, PaymentStatus, Prisma } from "../generated/prisma/client";
import { releaseReservation } from "./expiry";
import { canTransition, paidStatuses, reservedStatuses } from "./status";

type Tx = Prisma.TransactionClient;

export class TransitionError extends Error {}

interface TransitionOptions {
  actorId?: string | null;
  note?: string;
  paymentStatus?: PaymentStatus;
}

async function moveStock(tx: Tx, orderId: string, mode: "cobrar" | "cobrar_libre" | "restaurar"): Promise<void> {
  const items = await tx.orderItem.findMany({ where: { orderId }, select: { variantId: true, quantity: true } });
  for (const { variantId, quantity } of items) {
    let changed: number;
    if (mode === "cobrar") {
      // La reserva pasa a ser venta: sale del stock y de lo reservado.
      changed = await tx.$executeRaw`
        UPDATE product_variants SET stock = stock - ${quantity}, "reservedStock" = "reservedStock" - ${quantity}
        WHERE id = ${variantId} AND "reservedStock" >= ${quantity} AND stock >= ${quantity}`;
    } else if (mode === "cobrar_libre") {
      // Pago tardío de un pedido que ya había liberado su reserva: se toma de lo que esté libre.
      changed = await tx.$executeRaw`
        UPDATE product_variants SET stock = stock - ${quantity}
        WHERE id = ${variantId} AND stock - "reservedStock" >= ${quantity}`;
    } else {
      changed = await tx.$executeRaw`UPDATE product_variants SET stock = stock + ${quantity} WHERE id = ${variantId}`;
    }
    if (changed === 0) throw new TransitionError("No hay stock suficiente para completar este cambio.");
  }
}

/**
 * Cambia el estado de un pedido dentro de una transacción: valida la transición, mueve el inventario
 * y deja el evento en el historial. Si el pedido ya está en ese estado no hace nada (idempotente).
 */
export async function applyTransition(
  tx: Tx,
  orderId: string,
  to: OrderStatus,
  options: TransitionOptions = {},
): Promise<{ changed: boolean; from: OrderStatus }> {
  const rows = await tx.$queryRaw<{ status: OrderStatus }[]>`SELECT status FROM orders WHERE id = ${orderId} FOR UPDATE`;
  const from = rows[0]?.status;
  if (!from) throw new TransitionError("El pedido no existe.");
  if (from === to) return { changed: false, from };
  if (!canTransition(from, to)) throw new TransitionError(`No se puede pasar un pedido de «${from}» a «${to}».`);

  if (to === "pagado") {
    await moveStock(tx, orderId, from === "expirado" ? "cobrar_libre" : "cobrar");
  } else if (to === "cancelado" || to === "expirado") {
    if (reservedStatuses.includes(from)) await releaseReservation(tx, orderId);
    else if (paidStatuses.includes(from) && from !== "enviado" && from !== "entregado") await moveStock(tx, orderId, "restaurar");
  }

  const data: Prisma.OrderUpdateInput = { status: to };
  if (to === "pagado") {
    data.paidAt = new Date();
    data.reservationExpiresAt = null;
    data.paymentStatus = options.paymentStatus ?? "approved";
  } else if (to === "cancelado" || to === "expirado") {
    data.reservationExpiresAt = null;
  } else if (to === "reembolsado") {
    data.paymentStatus = "refunded";
  } else if (options.paymentStatus) {
    data.paymentStatus = options.paymentStatus;
  }
  await tx.order.update({ where: { id: orderId }, data });
  await tx.orderEvent.create({
    data: { orderId, type: "estado", fromStatus: from, toStatus: to, actorId: options.actorId ?? null, note: options.note },
  });
  return { changed: true, from };
}

/** Envía al cliente el correo que corresponde al estado actual del pedido. No lanza nunca. */
export async function sendOrderStatusEmail(orderId: string): Promise<void> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true, pickupLocation: true },
    });
    if (!order) return;
    const message = orderStatusEmail({
      code: order.code,
      customerName: order.customerName,
      email: order.email,
      status: order.status,
      shippingMethod: order.shippingMethod,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      discount: order.discount,
      total: order.total,
      items: order.items,
      pickupLocation: order.pickupLocation,
    });
    if (message) await sendEmail(message);
  } catch (error) {
    console.error("[pedido] No se pudo enviar el correo", error instanceof Error ? error.message : error);
  }
}

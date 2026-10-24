import { db } from "../db";
import { clearCartItems } from "../cart/view";
import type { OrderStatus } from "../generated/prisma/client";
import { getPaymentProvider } from "../payments";
import { notifyRestock } from "../admin/stock-alerts";
import { applyTransition, sendOrderStatusEmail, TransitionError } from "./lifecycle";
import { canTransition, statusLabel } from "./status";

export type AdminResult = { ok: true; message: string } | { ok: false; message: string };

/** Estados que el administrador puede poner a mano, además de los que ya permite la máquina de estados. */
export const MANUAL_PAID_FROM: OrderStatus[] = ["pendiente_pago", "pago_fallido", "expirado"];

/**
 * Cambia el estado de un pedido como administrador. Usa la misma función que el webhook, así el
 * inventario y el historial se comportan igual. Un reembolso pasa primero por el proveedor de pagos.
 */
export async function changeOrderStatus(input: { code: string; to: OrderStatus; actorId: string; note?: string }): Promise<AdminResult> {
  const order = await db.order.findUnique({
    where: { code: input.code },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!order) return { ok: false, message: "No encontramos ese pedido." };
  if (order.status === input.to) return { ok: true, message: `El pedido ya está en «${statusLabel[input.to]}».` };
  if (!canTransition(order.status, input.to)) {
    return { ok: false, message: `Un pedido «${statusLabel[order.status]}» no puede pasar a «${statusLabel[input.to]}».` };
  }

  let note = input.note?.trim() || undefined;

  if (input.to === "reembolsado") {
    const payment = order.payments[0];
    if (!payment || payment.status !== "approved") {
      return { ok: false, message: "Este pedido no tiene un pago aprobado que reembolsar." };
    }
    const provider = getPaymentProvider();
    if (provider.id === payment.provider && provider.refund) {
      const refund = await provider.refund(payment.providerRef, payment.amount);
      if (!refund.ok) return { ok: false, message: `El proveedor no pudo hacer el reembolso: ${refund.message ?? "sin detalle"}. El pedido sigue igual.` };
      await db.payment.update({ where: { id: payment.id }, data: { status: "refunded" } });
      note = [note, refund.message].filter(Boolean).join(" ");
    } else {
      note = [note, "Reembolso registrado a mano: hay que devolver el dinero fuera de la tienda."].filter(Boolean).join(" ");
    }
  }

  try {
    await db.$transaction(async (tx) => {
      await applyTransition(tx, order.id, input.to, {
        actorId: input.actorId,
        note: input.to === "pagado" ? [note, "Marcado como pagado a mano."].filter(Boolean).join(" ") : note,
      });
    });
  } catch (error) {
    if (error instanceof TransitionError) return { ok: false, message: error.message };
    throw error;
  }

  if (input.to === "pagado" && order.cartId) await clearCartItems(order.cartId);
  await sendOrderStatusEmail(order.id);
  // Si el pedido pagado se cancela, sus unidades vuelven al inventario: se avisa a quien las esperaba.
  if (input.to === "cancelado") {
    const items = await db.orderItem.findMany({ where: { orderId: order.id }, select: { variantId: true } });
    await notifyRestock(items.map((i) => i.variantId));
  }
  return { ok: true, message: `El pedido ${order.code} pasó a «${statusLabel[input.to]}».` };
}

export async function addOrderNote(input: { code: string; text: string; actorId: string }): Promise<AdminResult> {
  const text = input.text.trim();
  if (text.length < 2) return { ok: false, message: "Escribe la nota." };
  if (text.length > 1000) return { ok: false, message: "La nota puede tener hasta 1,000 caracteres." };
  const order = await db.order.findUnique({ where: { code: input.code }, select: { id: true } });
  if (!order) return { ok: false, message: "No encontramos ese pedido." };
  await db.orderEvent.create({ data: { orderId: order.id, type: "nota", actorId: input.actorId, note: text } });
  return { ok: true, message: "Guardamos la nota." };
}

import { db } from "../db";
import { clearCartItems } from "../cart/view";
import type { OrderStatus, PaymentStatus } from "../generated/prisma/client";
import { applyTransition, sendOrderStatusEmail } from "./lifecycle";

export interface PaymentResultInput {
  provider: string;
  providerRef: string;
  status: PaymentStatus;
  raw: unknown;
  /** Monto que informa el proveedor, si lo informa. Se compara con el total del pedido. */
  amount?: number;
}

export type PaymentOutcome =
  | { kind: "desconocido" }
  | { kind: "sin_cambios"; orderCode: string }
  | { kind: "aplicado"; orderCode: string; orderStatus: OrderStatus };

/**
 * Aplica el resultado de un pago a su pedido. Lo usan el webhook y el regreso del cliente.
 *
 * Es idempotente: el mismo resultado dos veces no cobra ni descuenta stock dos veces, porque se
 * bloquea la fila del pago y se compara con el estado que ya tiene. Un pago aprobado nunca se degrada.
 */
export async function applyPaymentResult(input: PaymentResultInput): Promise<PaymentOutcome> {
  const result = await db.$transaction(async (tx) => {
    const found = await tx.$queryRaw<{ id: string; orderId: string; status: PaymentStatus; amount: number }[]>`
      SELECT id, "orderId", status, amount FROM payments
      WHERE provider = ${input.provider} AND "providerRef" = ${input.providerRef} FOR UPDATE`;
    const payment = found[0];
    if (!payment) return { kind: "desconocido" } as const;

    const order = await tx.order.findUniqueOrThrow({
      where: { id: payment.orderId },
      select: { id: true, code: true, total: true, status: true, cartId: true },
    });

    if (payment.status === input.status) return { kind: "sin_cambios", orderCode: order.code } as const;
    if (payment.status === "approved" && input.status !== "refunded") {
      return { kind: "sin_cambios", orderCode: order.code } as const;
    }

    const rawResponse = JSON.parse(JSON.stringify({ webhook: input.raw }));
    const amountMismatch =
      input.status === "approved" && (payment.amount !== order.total || (input.amount !== undefined && input.amount !== order.total));

    if (amountMismatch) {
      // El monto cobrado no es el del pedido: no se marca como pagado, queda para revisión.
      await tx.payment.update({ where: { id: payment.id }, data: { status: "error", rawResponse } });
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: "alerta",
          note: `El proveedor aprobó un pago de un monto distinto al del pedido (esperado ${order.total}, recibido ${input.amount ?? payment.amount}, en centavos). Requiere revisión.`,
        },
      });
      return { kind: "aplicado", orderCode: order.code, orderStatus: order.status, notify: false, clearCart: false } as const;
    }

    await tx.payment.update({ where: { id: payment.id }, data: { status: input.status, rawResponse } });

    let status = order.status;
    let notify = false;
    let clearCart = false;

    if (input.status === "approved") {
      if (order.status === "expirado") {
        // Pago tardío: el pedido ya había soltado sus unidades. Se intenta tomarlas de nuevo.
        try {
          await tx.$executeRaw`SAVEPOINT pago_tardio`;
          await applyTransition(tx, order.id, "pagado", { note: "Pago aprobado después de expirar la reserva." });
          status = "pagado";
          notify = clearCart = true;
        } catch {
          await tx.$executeRaw`ROLLBACK TO SAVEPOINT pago_tardio`;
          await tx.orderEvent.create({
            data: {
              orderId: order.id,
              type: "alerta",
              note: "Se aprobó un pago después de expirar el pedido y ya no hay stock suficiente. Hay que reembolsar o conseguir las unidades.",
            },
          });
        }
      } else if (order.status === "pendiente_pago" || order.status === "pago_fallido") {
        await applyTransition(tx, order.id, "pagado", { note: "Pago aprobado por el proveedor." });
        status = "pagado";
        notify = clearCart = true;
      }
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "approved" } });
    } else if (input.status === "declined" || input.status === "cancelled" || input.status === "error") {
      if (order.status === "pendiente_pago") {
        await applyTransition(tx, order.id, "pago_fallido", { paymentStatus: input.status === "declined" ? "declined" : input.status });
        status = "pago_fallido";
        notify = true;
      }
    } else if (input.status === "refunded") {
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "refunded" } });
    } else {
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "pending" } });
      await tx.orderEvent.create({
        data: { orderId: order.id, type: "pago", note: "El proveedor dejó el pago pendiente de confirmación." },
      });
    }

    return { kind: "aplicado", orderCode: order.code, orderStatus: status, notify, clearCart, cartId: order.cartId, orderId: order.id } as const;
  });

  if (result.kind !== "aplicado") return result;
  if ("clearCart" in result && result.clearCart && result.cartId) await clearCartItems(result.cartId);
  if ("notify" in result && result.notify && result.orderId) await sendOrderStatusEmail(result.orderId);
  return { kind: "aplicado", orderCode: result.orderCode, orderStatus: result.orderStatus };
}

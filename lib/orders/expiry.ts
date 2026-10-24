import { db } from "../db";
import { reservedStatuses } from "./status";
import type { Prisma } from "../generated/prisma/client";

type Tx = Prisma.TransactionClient;

/** Devuelve al inventario el stock apartado por un pedido (sin tocar el estado). */
export async function releaseReservation(tx: Tx, orderId: string): Promise<void> {
  const items = await tx.orderItem.findMany({ where: { orderId }, select: { variantId: true, quantity: true } });
  for (const item of items) {
    await tx.$executeRaw`
      UPDATE product_variants SET "reservedStock" = GREATEST("reservedStock" - ${item.quantity}, 0)
      WHERE id = ${item.variantId}`;
  }
}

/**
 * Expira los pedidos sin pagar cuya reserva venció y libera su stock.
 * Se llama desde el cron y también al consultar el carrito o crear un pedido, para que una reserva
 * vencida nunca bloquee unidades aunque el cron todavía no haya corrido.
 */
export async function expireStaleReservations(now = new Date()): Promise<number> {
  const stale = await db.order.findMany({
    where: { status: { in: reservedStatuses }, reservationExpiresAt: { lt: now } },
    select: { id: true },
    take: 200,
  });
  let expired = 0;
  for (const { id } of stale) {
    await db.$transaction(async (tx) => {
      // Se bloquea la fila y se vuelve a comprobar: otro proceso pudo pagarla o expirarla ya.
      const rows = await tx.$queryRaw<{ status: string }[]>`SELECT status FROM orders WHERE id = ${id} FOR UPDATE`;
      if (!rows[0] || !(reservedStatuses as string[]).includes(rows[0].status)) return;
      await releaseReservation(tx, id);
      const expiring = await tx.order.findUnique({ where: { id }, select: { couponId: true } });
      if (expiring?.couponId) {
        await tx.$executeRaw`UPDATE coupons SET "usedCount" = GREATEST("usedCount" - 1, 0) WHERE id = ${expiring.couponId}`;
      }
      await tx.order.update({ where: { id }, data: { status: "expirado", reservationExpiresAt: null } });
      await tx.orderEvent.create({
        data: { orderId: id, type: "estado", fromStatus: rows[0].status as never, toStatus: "expirado", note: "No se pagó a tiempo. Stock liberado." },
      });
      expired++;
    });
  }
  return expired;
}

let lastSweep = 0;

/** Versión barata para rutas de lectura: como mucho una pasada cada 30 segundos por instancia. */
export async function sweepIfDue(): Promise<void> {
  const now = Date.now();
  if (now - lastSweep < 30_000) return;
  lastSweep = now;
  await expireStaleReservations(new Date(now)).catch(() => undefined);
}

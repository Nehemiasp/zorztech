import { db } from "../db";
import { startOfTodayGT } from "./dates";

export async function getDashboard() {
  const today = startOfTodayGT();
  const [createdToday, paidToday, awaitingPayment, toShip, review, sampleProducts] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: today } } }),
    db.order.aggregate({ where: { paidAt: { gte: today } }, _count: true, _sum: { total: true } }),
    db.order.count({ where: { status: { in: ["pendiente_pago", "pago_fallido"] } } }),
    db.order.findMany({
      where: { status: { in: ["pagado", "en_preparacion"] } },
      orderBy: { paidAt: "asc" },
      take: 8,
      select: { code: true, customerName: true, status: true, total: true, paidAt: true, shippingMethod: true },
    }),
    // Pagos que necesitan una persona: cobrados sobre un pedido expirado, o con alertas sin resolver.
    db.order.findMany({
      where: {
        OR: [
          { status: "expirado", paymentStatus: "approved" },
          { status: { in: ["expirado", "pendiente_pago", "pago_fallido"] }, events: { some: { type: "alerta" } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { code: true, status: true, total: true, events: { where: { type: "alerta" }, orderBy: { createdAt: "desc" }, take: 1, select: { note: true } } },
    }),
    db.product.count({ where: { isSample: true, isActive: true } }),
  ]);

  const lowStock = await db.$queryRaw<
    { sku: string; variant: string; product: string; productId: string; available: number; threshold: number }[]
  >`
    SELECT v.sku, v.name AS variant, p.name AS product, p.id AS "productId",
           GREATEST(v.stock - v."reservedStock", 0)::int AS available, v."lowStockThreshold" AS threshold
    FROM product_variants v JOIN products p ON p.id = v."productId"
    WHERE v."isActive" AND p."isActive" AND v.stock - v."reservedStock" <= v."lowStockThreshold"
    ORDER BY available ASC, p.name LIMIT 10`;

  return {
    createdToday,
    paidToday: { count: paidToday._count, total: paidToday._sum.total ?? 0 },
    awaitingPayment,
    toShip,
    review,
    lowStock,
    sampleProducts,
  };
}

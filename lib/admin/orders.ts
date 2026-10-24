import { z } from "zod";
import { db } from "../db";
import { OrderStatus, type Prisma } from "../generated/prisma/client";
import { endOfDayGT, startOfDayGT } from "./dates";

export const ORDERS_PAGE_SIZE = 20;

const filtersSchema = z.object({
  estado: z.enum(Object.values(OrderStatus) as [OrderStatus, ...OrderStatus[]]).optional().catch(undefined),
  q: z.string().trim().max(100).catch(""),
  desde: z.string().trim().max(10).catch(""),
  hasta: z.string().trim().max(10).catch(""),
  pagina: z.coerce.number().int().min(1).max(1000).catch(1),
});

export type OrderFilters = z.infer<typeof filtersSchema>;

export function parseOrderFilters(raw: Record<string, string | string[] | undefined>): OrderFilters {
  const one = (k: string) => (Array.isArray(raw[k]) ? raw[k]![0] : raw[k]);
  return filtersSchema.parse({ estado: one("estado") || undefined, q: one("q") ?? "", desde: one("desde") ?? "", hasta: one("hasta") ?? "", pagina: one("pagina") ?? 1 });
}

export function orderWhere(f: OrderFilters): Prisma.OrderWhereInput {
  const from = f.desde ? startOfDayGT(f.desde) : null;
  const to = f.hasta ? endOfDayGT(f.hasta) : null;
  return {
    ...(f.estado ? { status: f.estado } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    ...(f.q
      ? {
          OR: [
            { code: { contains: f.q, mode: "insensitive" } },
            { email: { contains: f.q, mode: "insensitive" } },
            { customerName: { contains: f.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export async function listOrders(f: OrderFilters) {
  const where = orderWhere(f);
  const [rows, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (f.pagina - 1) * ORDERS_PAGE_SIZE,
      take: ORDERS_PAGE_SIZE,
      select: { code: true, createdAt: true, status: true, total: true, customerName: true, email: true, shippingMethod: true, _count: { select: { items: true } } },
    }),
    db.order.count({ where }),
  ]);
  return { rows, total, pageCount: Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE)) };
}

export async function getAdminOrder(code: string) {
  const order = await db.order.findUnique({
    where: { code },
    include: {
      items: { orderBy: { id: "asc" } },
      pickupLocation: true,
      coupon: { select: { code: true } },
      payments: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "desc" } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!order) return null;
  const actorIds = [...new Set(order.events.map((e) => e.actorId).filter((id): id is string => Boolean(id)))];
  const actors = actorIds.length ? await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } }) : [];
  return { ...order, actorNames: Object.fromEntries(actors.map((a) => [a.id, a.name])) as Record<string, string> };
}

export type AdminOrder = NonNullable<Awaited<ReturnType<typeof getAdminOrder>>>;

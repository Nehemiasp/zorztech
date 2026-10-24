import { db } from "../db";
import { Prisma } from "../generated/prisma/client";
import { paidStatuses } from "../orders/status";

export const CUSTOMERS_PAGE_SIZE = 20;

export async function listCustomers(q: string, page: number) {
  const search = q ? Prisma.sql`AND (u.name ILIKE ${`%${q}%`} OR u.email ILIKE ${`%${q}%`})` : Prisma.empty;
  const paid = Prisma.join(paidStatuses);
  const [rows, count] = await Promise.all([
    db.$queryRaw<{ id: string; name: string; email: string; createdAt: Date; orders: number; spent: number }[]>`
      SELECT u.id, u.name, u.email, u."createdAt",
             COUNT(o.id)::int AS orders,
             COALESCE(SUM(o.total) FILTER (WHERE o.status::text IN (${paid})), 0)::int AS spent
      FROM users u LEFT JOIN orders o ON o."userId" = u.id
      WHERE u.role = 'cliente' ${search}
      GROUP BY u.id ORDER BY u."createdAt" DESC
      LIMIT ${CUSTOMERS_PAGE_SIZE} OFFSET ${(page - 1) * CUSTOMERS_PAGE_SIZE}`,
    db.$queryRaw<{ total: number }[]>`SELECT COUNT(*)::int AS total FROM users u WHERE u.role = 'cliente' ${search}`,
  ]);
  const total = count[0]?.total ?? 0;
  return { rows, total, pageCount: Math.max(1, Math.ceil(total / CUSTOMERS_PAGE_SIZE)) };
}

export async function getCustomer(id: string) {
  return db.user.findFirst({
    where: { id, role: "cliente" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      addresses: { orderBy: [{ esPredeterminada: "desc" }, { id: "asc" }] },
      orders: { orderBy: { createdAt: "desc" }, select: { code: true, createdAt: true, status: true, total: true } },
    },
  });
}

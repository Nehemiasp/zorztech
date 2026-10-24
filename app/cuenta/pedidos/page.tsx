import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatGTQ } from "@/lib/money";
import { formatDateTime } from "@/lib/orders/queries";
import { statusLabel } from "@/lib/orders/status";

export const metadata: Metadata = { title: "Mis pedidos" };

export default async function OrdersPage() {
  const user = (await getCurrentUser())!;
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { code: true, createdAt: true, status: true, total: true, items: { select: { quantity: true } } },
  });

  if (orders.length === 0) {
    return (
      <p className="text-text-muted">
        Todavía no tienes pedidos. <Link href="/" className="text-brand-primary-strong underline underline-offset-2">Explora la tienda</Link>.
      </p>
    );
  }

  return (
    <table className="w-full text-left">
      <caption className="sr-only">Historial de pedidos</caption>
      <thead className="border-b border-border text-sm text-text-muted">
        <tr>
          <th scope="col" className="py-2 pr-4 font-medium">Pedido</th>
          <th scope="col" className="hidden py-2 pr-4 font-medium sm:table-cell">Fecha</th>
          <th scope="col" className="py-2 pr-4 font-medium">Estado</th>
          <th scope="col" className="py-2 text-right font-medium">Total</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.code} className="border-b border-border">
            <th scope="row" className="py-3 pr-4 font-medium">
              <Link href={`/cuenta/pedidos/${o.code}`} className="underline-offset-2 hover:underline">
                {o.code}
              </Link>
              <span className="block text-sm font-normal text-text-muted">{o.items.reduce((n, i) => n + i.quantity, 0)} productos</span>
            </th>
            <td className="hidden py-3 pr-4 sm:table-cell">{formatDateTime(o.createdAt)}</td>
            <td className="py-3 pr-4">{statusLabel[o.status]}</td>
            <td className="py-3 text-right">{formatGTQ(o.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

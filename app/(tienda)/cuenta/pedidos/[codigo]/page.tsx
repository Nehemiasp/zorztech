import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderSummary } from "@/components/orders/order-summary";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { RetryPaymentButton } from "@/components/orders/payment-actions";
import { getCurrentUser } from "@/lib/auth";
import { normalizeOrderCode } from "@/lib/orders/code";
import { formatDateTime, getOrderByCode } from "@/lib/orders/queries";

export const metadata: Metadata = { title: "Detalle del pedido" };

export default async function OrderDetailPage({ params }: { params: Promise<{ codigo: string }> }) {
  const user = (await getCurrentUser())!;
  const order = await getOrderByCode(normalizeOrderCode((await params).codigo));
  // Solo el dueño ve el pedido; para cualquier otra persona no existe.
  if (!order || order.userId !== user.id) notFound();

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="text-xl">
          Pedido <strong className="font-medium">{order.code}</strong>
        </p>
        <p className="text-sm text-text-muted">Hecho el {formatDateTime(order.createdAt)}</p>
      </div>
      <OrderTimeline order={order} />
      {(order.status === "pago_fallido" || order.status === "pendiente_pago") && <RetryPaymentButton code={order.code} label="Pagar ahora" />}
      <OrderSummary order={order} />
      <p>
        <Link href="/cuenta/pedidos" className="text-brand-primary-strong underline underline-offset-2">
          Volver a mis pedidos
        </Link>
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { OrderSummary } from "@/components/orders/order-summary";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { RetryPaymentButton } from "@/components/orders/payment-actions";
import { TrackingForm } from "@/components/orders/tracking-form";
import { hasOrderAccess } from "@/lib/orders/access";
import { normalizeOrderCode } from "@/lib/orders/code";
import { formatDateTime, getOrderByCode } from "@/lib/orders/queries";

export const metadata: Metadata = {
  title: "Seguir mi pedido",
  description: "Consulta el estado de tu pedido con su código y el correo de la compra.",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ codigo?: string }>;
}

export default async function TrackingPage({ searchParams }: Props) {
  const { codigo = "" } = await searchParams;
  const code = normalizeOrderCode(codigo.slice(0, 20));
  const order = code ? await getOrderByCode(code) : null;
  const allowed = order ? await hasOrderAccess(order) : false;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <Breadcrumbs items={[{ name: "Inicio", href: "/" }, { name: "Seguir mi pedido" }]} />
      <h1 className="mt-4 text-2xl md:text-3xl">Seguir mi pedido</h1>

      {order && allowed ? (
        <div className="mt-6 space-y-8">
          <div>
            <p className="text-lg">
              Pedido <strong className="font-medium">{order.code}</strong>
            </p>
            <p className="text-sm text-text-muted">Hecho el {formatDateTime(order.createdAt)}</p>
          </div>
          <OrderTimeline order={order} />
          {(order.status === "pago_fallido" || order.status === "pendiente_pago") && (
            <div>
              <RetryPaymentButton code={order.code} label="Pagar ahora" />
            </div>
          )}
          <OrderSummary order={order} />
          <p>
            <Link href="/pedido/seguimiento" className="text-brand-primary-strong underline underline-offset-2">
              Consultar otro pedido
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <p className="mb-6 max-w-[60ch] text-text-muted">Escribe el código de tu pedido y el correo con el que compraste. No necesitas una cuenta.</p>
          <TrackingForm defaultCode={code} />
        </div>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatGTQ } from "@/lib/money";
import { isMockProvider } from "@/lib/payments";
import { SimulatedPaymentForm } from "./form";

export const metadata: Metadata = { title: "Pago de prueba", robots: { index: false, follow: false } };

interface Props {
  searchParams: Promise<{ ref?: string; volver?: string }>;
}

export default async function SimulatedPaymentPage({ searchParams }: Props) {
  // Solo existe mientras la pasarela activa es la simulada: con un proveedor real, esta ruta no existe.
  if (!isMockProvider()) notFound();

  const { ref, volver = "/" } = await searchParams;
  const payment = ref ? await db.payment.findFirst({ where: { provider: "mock", providerRef: ref }, include: { order: { select: { code: true } } } }) : null;
  if (!payment) notFound();

  const final = payment.status === "approved" || payment.status === "refunded";

  return (
    <div className="mx-auto max-w-lg px-4 py-10 md:py-16">
      <p className="inline-block rounded-sm bg-surface-dark-alt px-2 py-0.5 text-sm text-text-on-dark">Pasarela simulada</p>
      <h1 className="mt-3 text-2xl md:text-3xl">Pago de prueba</h1>
      <p className="mt-3 text-text-muted">No se cobra nada. Elige qué respuesta debe dar la pasarela y la tienda la procesará como si viniera de un proveedor real.</p>

      <dl className="mt-6 divide-y divide-border rounded-lg border border-border">
        <div className="flex justify-between p-4">
          <dt className="text-text-muted">Pedido</dt>
          <dd className="font-medium">{payment.order.code}</dd>
        </div>
        <div className="flex justify-between p-4">
          <dt className="text-text-muted">Monto</dt>
          <dd className="text-xl font-medium">{formatGTQ(payment.amount)}</dd>
        </div>
        <div className="flex justify-between p-4">
          <dt className="text-text-muted">Estado del pago</dt>
          <dd>{payment.status}</dd>
        </div>
      </dl>

      {final ? (
        <p role="status" className="mt-6">
          Este pago ya está {payment.status === "approved" ? "aprobado" : "reembolsado"}.{" "}
          <a href={volver} className="text-brand-primary-strong underline underline-offset-2">
            Volver a la tienda
          </a>
        </p>
      ) : (
        <SimulatedPaymentForm providerRef={payment.providerRef} volver={volver} />
      )}
    </div>
  );
}

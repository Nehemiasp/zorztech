import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applyPaymentResult } from "@/lib/orders/payment-result";
import { getPaymentProvider } from "@/lib/payments";
import { siteConfig } from "@/lib/site";

/**
 * El cliente vuelve de la página de pago. Se consulta el estado al proveedor (por si el webhook todavía
 * no llegó), se aplica con la misma lógica idempotente y se lo lleva a la confirmación.
 */
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("codigo") ?? "";
  const order = await db.order.findUnique({
    where: { code },
    select: { code: true, payments: { orderBy: { createdAt: "desc" }, take: 1, select: { provider: true, providerRef: true, status: true } } },
  });
  const payment = order?.payments[0];
  if (order && payment && payment.status !== "approved") {
    try {
      const provider = getPaymentProvider();
      if (provider.id === payment.provider) {
        const status = await provider.getPaymentStatus(payment.providerRef);
        await applyPaymentResult({ provider: provider.id, providerRef: payment.providerRef, status, raw: { fuente: "regreso del cliente" } });
      }
    } catch (error) {
      console.error("[pagos] No se pudo consultar el estado", error instanceof Error ? error.message : error);
    }
  }
  const target = order ? `/pedido/${encodeURIComponent(order.code)}/confirmacion` : "/";
  return NextResponse.redirect(new URL(target, siteConfig.url));
}

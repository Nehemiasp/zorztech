import { NextResponse } from "next/server";
import { applyPaymentResult } from "@/lib/orders/payment-result";
import { getPaymentProvider } from "@/lib/payments";

/**
 * Notificación del proveedor de pagos. No usa cookies ni sesión: se autoriza solo con la firma que el
 * proveedor pone en la petición (verifyWebhook). Responde 200 también cuando el aviso ya se había
 * procesado, para que el proveedor deje de reintentar.
 */
export async function POST(request: Request) {
  const provider = getPaymentProvider();
  const event = await provider.verifyWebhook(request);
  if (!event) return NextResponse.json({ error: "Firma no válida" }, { status: 401 });

  const raw = event.raw as { amount?: unknown } | null;
  const amount = typeof raw?.amount === "number" ? raw.amount : undefined;

  const outcome = await applyPaymentResult({
    provider: provider.id,
    providerRef: event.providerRef,
    status: event.status,
    raw: event.raw,
    amount,
  });
  if (outcome.kind === "desconocido") return NextResponse.json({ error: "Pago desconocido" }, { status: 404 });
  return NextResponse.json({ received: true, result: outcome.kind });
}

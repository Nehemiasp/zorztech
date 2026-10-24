import { z } from "zod";
import { db } from "../../db";
import { randomToken, safeEqual, sign } from "../../security";
import { siteConfig } from "../../site";
import type { PaymentMethod, PaymentProvider, PaymentStatus } from "../types";

/** Encabezado con la firma del webhook, igual que lo haría un proveedor real. */
export const MOCK_SIGNATURE_HEADER = "x-zorztech-signature";

export const mockMethods: PaymentMethod[] = [
  {
    id: "simulado",
    label: "Pago en línea de prueba",
    description: "Pasarela simulada: tú decides si el pago se aprueba, se rechaza o queda pendiente.",
  },
];

const webhookBody = z.object({
  providerRef: z.string().min(1).max(100),
  status: z.enum(["pending", "approved", "declined", "cancelled", "refunded", "error"]),
  amount: z.number().int().nonnegative().optional(),
  currency: z.literal("GTQ").optional(),
});

/** Clave de firma del webhook: la del entorno si existe y, si no, una derivada de AUTH_SECRET. */
const signingPurpose = "mock-webhook";

export function signMockWebhook(rawBody: string): string {
  const custom = process.env.PAYMENT_WEBHOOK_SECRET;
  return custom ? sign(`${signingPurpose}:${custom}`, rawBody) : sign(signingPurpose, rawBody);
}

function verifyMockSignature(rawBody: string, signature: string): boolean {
  return signature.length > 0 && safeEqual(signMockWebhook(rawBody), signature);
}

export const mockProvider: PaymentProvider = {
  id: "mock",

  async createPayment(input) {
    const providerRef = `MOCK-${randomToken(9)}`;
    const url = new URL("/pago-simulado", siteConfig.url);
    url.searchParams.set("ref", providerRef);
    url.searchParams.set("volver", input.returnUrl);
    url.searchParams.set("cancelar", input.cancelUrl);
    return { kind: "redirect", url: url.toString(), providerRef };
  },

  async getPaymentStatus(providerRef): Promise<PaymentStatus> {
    const payment = await db.payment.findFirst({ where: { provider: "mock", providerRef }, select: { status: true } });
    return payment?.status ?? "error";
  },

  async verifyWebhook(req) {
    const rawBody = await req.clone().text();
    const signature = req.headers.get(MOCK_SIGNATURE_HEADER) ?? "";
    if (!verifyMockSignature(rawBody, signature)) return null;
    let parsed;
    try {
      parsed = webhookBody.safeParse(JSON.parse(rawBody));
    } catch {
      return null;
    }
    if (!parsed.success) return null;
    return { providerRef: parsed.data.providerRef, status: parsed.data.status, raw: parsed.data };
  },

  async refund() {
    return { ok: true, message: "Reembolso simulado." };
  },
};

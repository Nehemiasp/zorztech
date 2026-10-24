"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { isMockProvider } from "@/lib/payments";
import { MOCK_SIGNATURE_HEADER, signMockWebhook } from "@/lib/payments/providers/mock";
import { siteConfig } from "@/lib/site";

const schema = z.object({
  ref: z.string().min(1).max(100),
  resultado: z.enum(["approved", "declined", "pending"]),
  volver: z.string().max(500),
});

/**
 * Simula lo que hace una pasarela real: manda a nuestro webhook, con firma, el resultado que eligió quien prueba.
 * Así el flujo completo (webhook, estados, stock, correos) se ejercita igual que con un proveedor de verdad.
 */
export async function simulatePayment(formData: FormData): Promise<{ volver: string }> {
  if (!isMockProvider()) redirect("/");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/");

  const payment = await db.payment.findFirst({ where: { provider: "mock", providerRef: parsed.data.ref } });
  if (!payment) redirect("/");

  const body = JSON.stringify({
    providerRef: payment.providerRef,
    status: parsed.data.resultado,
    amount: payment.amount,
    currency: "GTQ",
  });
  const res = await fetch(`${siteConfig.url}/api/payments/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", [MOCK_SIGNATURE_HEADER]: signMockWebhook(body) },
    body,
    cache: "no-store",
  });
  if (!res.ok) throw new Error("El webhook rechazó la notificación simulada.");

  // Solo se vuelve a una dirección del propio sitio (evita redirecciones abiertas). El navegador
  // la abre con una navegación completa, como haría al volver de la página de un proveedor real.
  return { volver: parsed.data.volver.startsWith(`${siteConfig.url}/`) ? parsed.data.volver : "/" };
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { email } from "@/lib/auth/schemas";
import { db } from "@/lib/db";
import { grantOrderAccess } from "@/lib/orders/access";
import { normalizeOrderCode } from "@/lib/orders/code";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export interface TrackingState {
  error?: string;
  fields?: { codigo?: string; email?: string };
  codigo?: string;
}

const schema = z.object({
  codigo: z.string().trim().min(4, "Escribe el código de tu pedido.").max(20, "El código es más corto."),
  email,
});

/**
 * Para ver un pedido sin cuenta hay que conocer su código y el correo con el que se compró.
 * Si coinciden, se da acceso con una cookie firmada y se muestra el seguimiento.
 */
export async function trackOrder(_prev: TrackingState, formData: FormData): Promise<TrackingState> {
  const parsed = schema.safeParse({ codigo: formData.get("codigo"), email: formData.get("email") });
  if (!parsed.success) {
    const fields: NonNullable<TrackingState["fields"]> = {};
    for (const issue of parsed.error.issues) fields[issue.path[0] as "codigo" | "email"] ??= issue.message;
    return { fields, codigo: String(formData.get("codigo") ?? "") };
  }

  const ip = clientIp(await headers());
  if (!rateLimit(`seguimiento:${ip}`, 8, 10 * 60_000)) {
    return { error: "Hiciste muchas consultas seguidas. Espera unos minutos e inténtalo de nuevo.", codigo: parsed.data.codigo };
  }

  const code = normalizeOrderCode(parsed.data.codigo);
  const order = await db.order.findUnique({ where: { code }, select: { code: true, email: true } });
  // El mismo mensaje si no existe el código o si el correo no coincide: no se revela cuál de los dos falló.
  if (!order || order.email.toLowerCase() !== parsed.data.email) {
    return { error: "No encontramos un pedido con ese código y ese correo. Revisa que estén como en tu confirmación.", codigo: parsed.data.codigo };
  }

  await grantOrderAccess(order.code);
  redirect(`/pedido/seguimiento?codigo=${encodeURIComponent(order.code)}`);
}

import { z } from "zod";
import { apiError, json, readBody } from "@/lib/api";
import { email } from "@/lib/auth/schemas";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ variantId: z.string().min(1).max(40), email });

/** "Avisarme cuando llegue": guarda el correo para avisar una sola vez cuando la variante vuelva a tener unidades. */
export async function POST(request: Request) {
  if (!rateLimit(`aviso:${clientIp(request.headers)}`, 10, 10 * 60_000)) {
    return apiError("Hiciste muchos intentos seguidos. Espera unos minutos e inténtalo de nuevo.", 429);
  }
  const body = await readBody(request, schema);
  if (!body.ok) return body.response;

  const variant = await db.productVariant.findFirst({
    where: { id: body.data.variantId, isActive: true, product: { isActive: true } },
    select: { id: true, stock: true, reservedStock: true },
  });
  if (!variant) return apiError("Este producto ya no está disponible.", 404);
  if (variant.stock - variant.reservedStock > 0) return apiError("Este producto ya tiene unidades disponibles.", 409);

  await db.stockAlert.upsert({
    where: { variantId_email: { variantId: variant.id, email: body.data.email } },
    update: { notifiedAt: null },
    create: { variantId: variant.id, email: body.data.email },
  });
  return json({ ok: true });
}

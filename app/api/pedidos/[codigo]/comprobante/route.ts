import { apiError, json } from "@/lib/api";
import { db } from "@/lib/db";
import { canViewOrder } from "@/lib/orders/access";
import { normalizeOrderCode } from "@/lib/orders/code";
import { addProof } from "@/lib/orders/proofs";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security";

/** Sube un comprobante de transferencia. Solo quien puede ver el pedido (sesión, cookie o enlace firmado). */
export async function POST(request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  if (!isSameOrigin(request)) return apiError("Origen no permitido.", 403);
  if (!rateLimit(`comprobante:${clientIp(request.headers)}`, 10, 10 * 60_000)) {
    return apiError("Hiciste muchos intentos seguidos. Espera unos minutos e inténtalo de nuevo.", 429);
  }
  const code = normalizeOrderCode((await params).codigo);
  const form = await request.formData().catch(() => null);
  const file = form?.get("archivo");
  const token = form?.get("t");
  if (!(file instanceof File)) return apiError("Elige una foto o captura del comprobante.", 422);

  const order = await db.order.findUnique({ where: { code }, select: { code: true, userId: true } });
  if (!order || !(await canViewOrder(order, typeof token === "string" ? token : null))) return apiError("No encontramos ese pedido.", 404);

  const result = await addProof(order.code, file);
  return result.ok ? json({ count: result.count }) : apiError(result.message, 422);
}

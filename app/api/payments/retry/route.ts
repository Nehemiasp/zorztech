import { z } from "zod";
import { apiError, json, readBody } from "@/lib/api";
import { db } from "@/lib/db";
import { hasOrderAccess } from "@/lib/orders/access";
import { retryPayment } from "@/lib/orders/create";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ codigo: z.string().min(4).max(20) });

export async function POST(request: Request) {
  if (!rateLimit(`reintento:${clientIp(request.headers)}`, 12, 10 * 60_000)) {
    return apiError("Hiciste muchos intentos seguidos. Espera unos minutos e inténtalo de nuevo.", 429);
  }
  const body = await readBody(request, schema);
  if (!body.ok) return body.response;

  const order = await db.order.findUnique({ where: { code: body.data.codigo }, select: { code: true, userId: true } });
  if (!order || !(await hasOrderAccess(order))) return apiError("No encontramos ese pedido.", 404);

  const result = await retryPayment(order.code);
  return result.ok ? json({ payment: result.payment }) : apiError(result.message, 409);
}

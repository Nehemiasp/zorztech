import { z } from "zod";
import { apiError, checkOrigin, json, readBody } from "@/lib/api";
import { applyCoupon, removeCoupon } from "@/lib/cart/service";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ codigo: z.string().trim().min(1).max(40) });

export async function POST(request: Request) {
  // Frena a quien prueba códigos al azar.
  if (!rateLimit(`cupon:${clientIp(request.headers)}`, 15, 10 * 60_000)) {
    return apiError("Probaste muchos cupones seguidos. Espera unos minutos e inténtalo de nuevo.", 429);
  }
  const body = await readBody(request, schema);
  if (!body.ok) return body.response;
  const result = await applyCoupon(body.data.codigo);
  return result.ok ? json(result.change) : apiError(result.message, 422);
}

export async function DELETE(request: Request) {
  const blocked = checkOrigin(request);
  if (blocked) return blocked;
  return json(await removeCoupon());
}

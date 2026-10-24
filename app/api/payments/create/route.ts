import { apiError, json, readBody } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { resolveCart } from "@/lib/cart/service";
import { checkoutSchema } from "@/lib/checkout/schema";
import { createOrderFromCart } from "@/lib/orders/create";
import { grantOrderAccess } from "@/lib/orders/access";
import { getPaymentMethods } from "@/lib/payments";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!rateLimit(`pedido:${clientIp(request.headers)}`, 12, 10 * 60_000)) {
    return apiError("Hiciste muchos intentos seguidos. Espera unos minutos e inténtalo de nuevo.", 429);
  }
  const body = await readBody(request, checkoutSchema);
  if (!body.ok) return body.response;

  if (!getPaymentMethods().some((m) => m.id === body.data.paymentMethod)) {
    return apiError("Elige una forma de pago disponible.", 422, { fields: { paymentMethod: "Elige una forma de pago disponible." } });
  }

  const user = await getCurrentUser();
  const cart = await resolveCart(false);
  const result = await createOrderFromCart(body.data, user?.id ?? null, cart?.id ?? null);
  if (!result.ok) {
    // Si el pedido ya existe (falló solo el inicio del pago) el cliente puede reintentarlo desde su confirmación.
    if (result.code) await grantOrderAccess(result.code);
    return apiError(result.message, 409, { code: result.error, orderCode: result.code });
  }
  await grantOrderAccess(result.code);
  return json({ code: result.code, payment: result.payment });
}

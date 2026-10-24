import { z } from "zod";
import { apiError, json, readBody } from "@/lib/api";
import { CartError, addToCart } from "@/lib/cart/service";
import { MAX_PER_LINE } from "@/lib/cart/types";

const schema = z.object({ variantId: z.string().min(1).max(40), quantity: z.number().int().min(1).max(MAX_PER_LINE) });

export async function POST(request: Request) {
  const body = await readBody(request, schema);
  if (!body.ok) return body.response;
  try {
    return json(await addToCart(body.data.variantId, body.data.quantity));
  } catch (error) {
    if (error instanceof CartError) return apiError(error.message, 409, { code: error.code });
    throw error;
  }
}

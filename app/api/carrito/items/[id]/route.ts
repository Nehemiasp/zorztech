import { z } from "zod";
import { apiError, checkOrigin, json, readBody } from "@/lib/api";
import { CartError, removeItem, setQuantity } from "@/lib/cart/service";

const schema = z.object({ quantity: z.number().int().min(1).max(99) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await readBody(request, schema);
  if (!body.ok) return body.response;
  try {
    return json(await setQuantity((await params).id, body.data.quantity));
  } catch (error) {
    if (error instanceof CartError) return apiError(error.message, 404, { code: error.code });
    throw error;
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = checkOrigin(request);
  if (blocked) return blocked;
  return json(await removeItem((await params).id));
}

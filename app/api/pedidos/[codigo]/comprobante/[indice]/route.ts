import { db } from "@/lib/db";
import { canViewOrder } from "@/lib/orders/access";
import { normalizeOrderCode } from "@/lib/orders/code";
import { readProofImage } from "@/lib/orders/proofs";

/** Muestra un comprobante. Solo para quien puede ver el pedido (el cliente o un administrador). */
export async function GET(request: Request, { params }: { params: Promise<{ codigo: string; indice: string }> }) {
  const { codigo, indice } = await params;
  const code = normalizeOrderCode(codigo);
  const order = await db.order.findUnique({ where: { code }, select: { code: true, userId: true } });
  const token = new URL(request.url).searchParams.get("t");
  if (!order || !(await canViewOrder(order, token))) return new Response("No encontrado", { status: 404 });

  const image = await readProofImage(order.code, Number(indice));
  if (!image) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.type,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

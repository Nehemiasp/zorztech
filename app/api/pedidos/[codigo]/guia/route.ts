import { db } from "@/lib/db";
import { canViewOrder } from "@/lib/orders/access";
import { normalizeOrderCode } from "@/lib/orders/code";
import { readShipmentDocument } from "@/lib/orders/shipment";

/** Muestra la foto o el PDF de la guía de envío. Solo para quien puede ver el pedido (el cliente o un administrador). */
export async function GET(request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const code = normalizeOrderCode((await params).codigo);
  const order = await db.order.findUnique({ where: { code }, select: { code: true, userId: true } });
  const token = new URL(request.url).searchParams.get("t");
  if (!order || !(await canViewOrder(order, token))) return new Response("No encontrado", { status: 404 });

  const doc = await readShipmentDocument(order.code);
  if (!doc) return new Response("No encontrado", { status: 404 });
  const extension = doc.type === "application/pdf" ? "pdf" : doc.type.split("/")[1];
  return new Response(doc.data, {
    headers: {
      "Content-Type": doc.type,
      "Content-Disposition": `inline; filename="guia-${order.code}.${extension}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

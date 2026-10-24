import { NextResponse } from "next/server";
import { centsToDecimal, toCsv } from "@/lib/admin/csv";
import { adminUser } from "@/lib/admin/guard";
import { orderWhere, parseOrderFilters } from "@/lib/admin/orders";
import { db } from "@/lib/db";
import { readShippingAddress } from "@/lib/orders/queries";
import { statusLabel } from "@/lib/orders/status";

const MAX_ROWS = 10_000;

/** Exporta a CSV los pedidos que cumplen los mismos filtros de la lista. Solo administradores. */
export async function GET(request: Request) {
  if (!(await adminUser())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const url = new URL(request.url);
  const filters = parseOrderFilters(Object.fromEntries(url.searchParams));
  const orders = await db.order.findMany({
    where: orderWhere(filters),
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    include: { items: true, pickupLocation: { select: { name: true } } },
  });

  const csv = toCsv(
    ["Código", "Fecha", "Estado", "Cliente", "Correo", "Teléfono", "Entrega", "Departamento", "Dirección o tienda", "Productos", "Subtotal (Q)", "Envío (Q)", "Descuento (Q)", "Total (Q)", "NIT", "Nombre factura", "Pagado el"],
    orders.map((o) => {
      const address = readShippingAddress(o.shippingAddress);
      return [
        o.code,
        o.createdAt.toISOString(),
        statusLabel[o.status],
        o.customerName,
        o.email,
        o.phone,
        o.shippingMethod === "domicilio" ? "Domicilio" : "Recogida",
        address?.departamento ?? "",
        address ? `${address.direccion}, ${address.municipio}` : (o.pickupLocation?.name ?? ""),
        o.items.map((i) => `${i.quantity} × ${i.productName}${i.variantName ? ` (${i.variantName})` : ""}`).join("; "),
        centsToDecimal(o.subtotal),
        centsToDecimal(o.shippingCost),
        centsToDecimal(o.discount),
        centsToDecimal(o.total),
        o.taxId,
        o.taxName,
        o.paidAt?.toISOString() ?? "",
      ];
    }),
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-zorztech-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

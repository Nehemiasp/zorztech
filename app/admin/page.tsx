import type { Metadata } from "next";
import Link from "next/link";
import { EmptyRow, Panel, PageHeader, ScrollRegion, StatusBadge, table } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { getDashboard } from "@/lib/admin/dashboard";
import { formatGTQ } from "@/lib/money";
import { formatDateTime } from "@/lib/orders/queries";

export const metadata: Metadata = { title: "Resumen" };

export default async function AdminDashboardPage() {
  await requireAdmin();
  const d = await getDashboard();

  const stats = [
    { label: "Pedidos de hoy", value: String(d.createdToday), href: "/admin/pedidos" },
    { label: "Pagados hoy", value: `${d.paidToday.count} · ${formatGTQ(d.paidToday.total)}`, href: "/admin/pedidos?estado=pagado" },
    { label: "Pendientes de pago", value: String(d.awaitingPayment), href: "/admin/pedidos?estado=pendiente_pago" },
    { label: "Por enviar o preparar", value: String(d.toShip.length === 8 ? "8 o más" : d.toShip.length), href: "/admin/pedidos?estado=pagado" },
  ];

  return (
    <>
      <PageHeader title="Resumen" />

      {d.sampleProducts > 0 && (
        <p role="status" className="mb-6 rounded-md border border-state-warning p-4">
          Tu catálogo todavía tiene <strong className="font-medium">{d.sampleProducts} productos de ejemplo</strong>, y las tarifas de envío y la tienda para recoger son datos de ejemplo.{" "}
          <Link href="/admin/productos?ejemplo=1" className="text-brand-primary-strong underline underline-offset-2">
            Ver productos de ejemplo
          </Link>{" "}
          ·{" "}
          <Link href="/admin/configuracion" className="text-brand-primary-strong underline underline-offset-2">
            Revisar configuración
          </Link>
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="block rounded-lg border border-border p-4 hover:bg-surface-light-alt">
              <span className="block text-sm text-text-muted">{s.label}</span>
              <span className="mt-1 block font-display text-xl">{s.value}</span>
            </Link>
          </li>
        ))}
      </ul>

      {d.review.length > 0 && (
        <Panel title="Pagos que necesitan revisión" className="mt-6 border-state-error">
          <p className="mb-3 text-text-muted">Cobros que no quedaron bien asociados a un pedido. Marca el pedido como pagado si hay stock, o cancélalo y reembolsa.</p>
          <ul className="divide-y divide-border">
            {d.review.map((o) => (
              <li key={o.code} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link href={`/admin/pedidos/${o.code}`} className="font-medium underline underline-offset-2">
                    {o.code}
                  </Link>{" "}
                  <StatusBadge status={o.status} />
                  {o.events[0]?.note && <p className="mt-1 text-sm text-text-muted">{o.events[0].note}</p>}
                </div>
                <span>{formatGTQ(o.total)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="mt-6 grid gap-6 2xl:grid-cols-2">
        <Panel title="Por enviar o preparar">
          <ScrollRegion label="Pedidos por enviar o preparar">
            <table className={table.table}>
              <thead className={table.head}>
                <tr>
                  <th scope="col" className={table.th}>Pedido</th>
                  <th scope="col" className={table.th}>Entrega</th>
                  <th scope="col" className={table.th}>Estado</th>
                  <th scope="col" className={`${table.th} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {d.toShip.length === 0 && <EmptyRow colSpan={4}>No hay pedidos por atender.</EmptyRow>}
                {d.toShip.map((o) => (
                  <tr key={o.code} className={table.row}>
                    <th scope="row" className={`${table.td} font-medium`}>
                      <Link href={`/admin/pedidos/${o.code}`} className="underline underline-offset-2">
                        {o.code}
                      </Link>
                      <span className="block text-sm font-normal text-text-muted">{o.customerName}</span>
                    </th>
                    <td className={table.td}>{o.shippingMethod === "domicilio" ? "Domicilio" : "Recogida"}</td>
                    <td className={table.td}>
                      <StatusBadge status={o.status} />
                      {o.paidAt && <span className="mt-1 block text-sm text-text-muted">Pagado {formatDateTime(o.paidAt)}</span>}
                    </td>
                    <td className={`${table.td} text-right`}>{formatGTQ(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        </Panel>

        <Panel title="Productos con poco stock">
          <ScrollRegion label="Productos con poco stock">
            <table className={table.table}>
              <thead className={table.head}>
                <tr>
                  <th scope="col" className={table.th}>Producto</th>
                  <th scope="col" className={table.th}>SKU</th>
                  <th scope="col" className={`${table.th} text-right`}>Disponibles</th>
                </tr>
              </thead>
              <tbody>
                {d.lowStock.length === 0 && <EmptyRow colSpan={3}>Todo el inventario está por encima de su mínimo.</EmptyRow>}
                {d.lowStock.map((v) => (
                  <tr key={v.sku} className={table.row}>
                    <th scope="row" className={`${table.td} font-medium`}>
                      <Link href={`/admin/productos/${v.productId}`} className="underline underline-offset-2">
                        {v.product}
                      </Link>
                      <span className="block text-sm font-normal text-text-muted">{v.variant}</span>
                    </th>
                    <td className={table.td}>{v.sku}</td>
                    <td className={`${table.td} text-right`}>
                      <span className={v.available === 0 ? "font-medium text-state-error" : "font-medium text-state-warning"}>{v.available}</span>
                      <span className="block text-sm text-text-muted">mínimo {v.threshold}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        </Panel>
      </div>
    </>
  );
}

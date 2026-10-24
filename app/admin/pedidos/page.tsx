import type { Metadata } from "next";
import Link from "next/link";
import { EmptyRow, PageHeader, StatusBadge, table, ScrollRegion } from "@/components/admin/ui";
import { Pagination } from "@/components/catalog/pagination";
import { buttonStyles } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { listOrders, parseOrderFilters, type OrderFilters } from "@/lib/admin/orders";
import { requireAdmin } from "@/lib/auth/guards";
import { formatGTQ } from "@/lib/money";
import { formatDateTime } from "@/lib/orders/queries";
import { statusLabel } from "@/lib/orders/status";

export const metadata: Metadata = { title: "Pedidos" };

const query = (f: Partial<OrderFilters>) => {
  const p = new URLSearchParams();
  if (f.estado) p.set("estado", f.estado);
  if (f.q) p.set("q", f.q);
  if (f.desde) p.set("desde", f.desde);
  if (f.hasta) p.set("hasta", f.hasta);
  if (f.pagina && f.pagina > 1) p.set("pagina", String(f.pagina));
  const s = p.toString();
  return s ? `?${s}` : "";
};

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const filters = parseOrderFilters(await searchParams);
  const { rows, total, pageCount } = await listOrders(filters);
  const active = Boolean(filters.estado || filters.q || filters.desde || filters.hasta);

  return (
    <>
      <PageHeader title="Pedidos">
        <a href={`/admin/pedidos/exportar${query({ ...filters, pagina: 1 })}`} className={buttonStyles("secondary-light")}>
          Exportar a CSV
        </a>
      </PageHeader>

      <form method="get" className="mb-6 grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_12rem_10rem_10rem_auto]">
        <TextField label="Buscar por código, correo o nombre" name="q" type="search" defaultValue={filters.q} />
        <SelectField
          label="Estado"
          name="estado"
          placeholder="Todos"
          options={Object.entries(statusLabel).map(([value, label]) => ({ value, label }))}
          defaultValue={filters.estado ?? ""}
        />
        <TextField label="Desde" name="desde" type="date" defaultValue={filters.desde} />
        <TextField label="Hasta" name="hasta" type="date" defaultValue={filters.hasta} />
        <div className="flex gap-2">
          <button type="submit" className={buttonStyles("primary")}>
            Filtrar
          </button>
          {active && (
            <Link href="/admin/pedidos" className={buttonStyles("secondary-light")}>
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <p aria-live="polite" className="mb-3 text-text-muted">
        {total === 1 ? "1 pedido" : `${total} pedidos`}
      </p>
      <ScrollRegion label="Pedidos">
        <table className={table.table}>
          <caption className="sr-only">Pedidos</caption>
          <thead className={table.head}>
            <tr>
              <th scope="col" className={table.th}>Pedido</th>
              <th scope="col" className={table.th}>Fecha</th>
              <th scope="col" className={table.th}>Cliente</th>
              <th scope="col" className={table.th}>Entrega</th>
              <th scope="col" className={table.th}>Estado</th>
              <th scope="col" className={`${table.th} text-right`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={6}>{active ? "Ningún pedido cumple esos filtros." : "Todavía no hay pedidos."}</EmptyRow>}
            {rows.map((o) => (
              <tr key={o.code} className={table.row}>
                <th scope="row" className={`${table.td} font-medium`}>
                  <Link href={`/admin/pedidos/${o.code}`} className="underline underline-offset-2">
                    {o.code}
                  </Link>
                  <span className="block text-sm font-normal text-text-muted">{o._count.items} {o._count.items === 1 ? "línea" : "líneas"}</span>
                </th>
                <td className={table.td}>{formatDateTime(o.createdAt)}</td>
                <td className={table.td}>
                  {o.customerName}
                  <span className="block text-sm text-text-muted">{o.email}</span>
                </td>
                <td className={table.td}>{o.shippingMethod === "domicilio" ? "Domicilio" : "Recogida"}</td>
                <td className={table.td}>
                  <StatusBadge status={o.status} />
                </td>
                <td className={`${table.td} text-right`}>{formatGTQ(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
      <Pagination page={filters.pagina} pageCount={pageCount} hrefFor={(page) => `/admin/pedidos${query({ ...filters, pagina: page })}`} />
    </>
  );
}

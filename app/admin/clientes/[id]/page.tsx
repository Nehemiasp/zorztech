import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyRow, Panel, StatusBadge, table, ScrollRegion } from "@/components/admin/ui";
import { getCustomer } from "@/lib/admin/customers";
import { requireAdmin } from "@/lib/auth/guards";
import { formatGTQ } from "@/lib/money";
import { formatDateTime } from "@/lib/orders/queries";

export const metadata: Metadata = { title: "Cliente" };

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const customer = await getCustomer((await params).id);
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm">
          <Link href="/admin/clientes" className="text-brand-primary-strong underline underline-offset-2">
            Clientes
          </Link>
        </p>
        <h1 className="mt-2 text-2xl">{customer.name}</h1>
        <p className="text-text-muted">
          {customer.email}
          {customer.phone ? ` · ${customer.phone}` : ""} · Cuenta creada el {formatDateTime(customer.createdAt)}
        </p>
      </div>

      <Panel title="Pedidos">
        <ScrollRegion label="Pedidos del cliente">
          <table className={table.table}>
            <caption className="sr-only">Pedidos del cliente</caption>
            <thead className={table.head}>
              <tr>
                <th scope="col" className={table.th}>Pedido</th>
                <th scope="col" className={table.th}>Fecha</th>
                <th scope="col" className={table.th}>Estado</th>
                <th scope="col" className={`${table.th} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.length === 0 && <EmptyRow colSpan={4}>Todavía no hizo pedidos.</EmptyRow>}
              {customer.orders.map((o) => (
                <tr key={o.code} className={table.row}>
                  <th scope="row" className={`${table.td} font-medium`}>
                    <Link href={`/admin/pedidos/${o.code}`} className="underline underline-offset-2">
                      {o.code}
                    </Link>
                  </th>
                  <td className={table.td}>{formatDateTime(o.createdAt)}</td>
                  <td className={table.td}>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className={`${table.td} text-right`}>{formatGTQ(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      </Panel>

      <Panel title="Direcciones guardadas">
        {customer.addresses.length === 0 ? (
          <p className="text-text-muted">No guardó direcciones.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {customer.addresses.map((a) => (
              <li key={a.id} className="rounded-md border border-border p-3">
                <p className="font-medium">
                  {a.nombre}
                  {a.esPredeterminada && <span className="ml-2 rounded-sm bg-surface-light-alt px-2 py-0.5 text-sm font-normal">Predeterminada</span>}
                </p>
                <p className="text-text-muted">
                  {a.direccion}, {a.municipio}, {a.departamento}
                  <br />
                  {a.telefono}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { EmptyRow, PageHeader, table, ScrollRegion } from "@/components/admin/ui";
import { Pagination } from "@/components/catalog/pagination";
import { buttonStyles } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { listCustomers } from "@/lib/admin/customers";
import { requireAdmin } from "@/lib/auth/guards";
import { formatGTQ } from "@/lib/money";
import { formatDateTime } from "@/lib/orders/queries";

export const metadata: Metadata = { title: "Clientes" };

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; pagina?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const page = Math.min(Math.max(Number(sp.pagina) || 1, 1), 1000);
  const { rows, total, pageCount } = await listCustomers(q, page);

  return (
    <>
      <PageHeader title="Clientes" />
      <p className="mb-4 max-w-[65ch] text-text-muted">Personas con cuenta. Quienes compran como invitados aparecen en Pedidos, con su correo.</p>
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <TextField label="Buscar por nombre o correo" name="q" type="search" defaultValue={q} className="min-w-64 flex-1" />
        <button type="submit" className={buttonStyles("primary")}>
          Buscar
        </button>
        {q && (
          <Link href="/admin/clientes" className={buttonStyles("secondary-light")}>
            Limpiar
          </Link>
        )}
      </form>
      <p aria-live="polite" className="mb-3 text-text-muted">
        {total === 1 ? "1 cliente" : `${total} clientes`}
      </p>
      <ScrollRegion label="Clientes">
        <table className={table.table}>
          <caption className="sr-only">Clientes</caption>
          <thead className={table.head}>
            <tr>
              <th scope="col" className={table.th}>Cliente</th>
              <th scope="col" className={table.th}>Registro</th>
              <th scope="col" className={`${table.th} text-right`}>Pedidos</th>
              <th scope="col" className={`${table.th} text-right`}>Compras pagadas</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={4}>{q ? "Ningún cliente cumple esa búsqueda." : "Todavía no hay clientes con cuenta."}</EmptyRow>}
            {rows.map((c) => (
              <tr key={c.id} className={table.row}>
                <th scope="row" className={`${table.td} font-medium`}>
                  <Link href={`/admin/clientes/${c.id}`} className="underline underline-offset-2">
                    {c.name}
                  </Link>
                  <span className="block text-sm font-normal text-text-muted">{c.email}</span>
                </th>
                <td className={table.td}>{formatDateTime(c.createdAt)}</td>
                <td className={`${table.td} text-right`}>{c.orders}</td>
                <td className={`${table.td} text-right`}>{formatGTQ(c.spent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
      <Pagination page={page} pageCount={pageCount} hrefFor={(p) => `/admin/clientes?${new URLSearchParams({ ...(q ? { q } : {}), ...(p > 1 ? { pagina: String(p) } : {}) })}`} />
    </>
  );
}

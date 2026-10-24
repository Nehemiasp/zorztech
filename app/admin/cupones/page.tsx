import type { Metadata } from "next";
import Link from "next/link";
import { EmptyRow, PageHeader, table, ScrollRegion } from "@/components/admin/ui";
import { buttonStyles } from "@/components/ui/button";
import { listCoupons } from "@/lib/admin/coupons";
import { requireAdmin } from "@/lib/auth/guards";
import { couponLabel } from "@/lib/coupons";
import { formatGTQ } from "@/lib/money";
import { formatDateTime } from "@/lib/orders/queries";

export const metadata: Metadata = { title: "Cupones" };

export default async function AdminCouponsPage({ searchParams }: { searchParams: Promise<{ creado?: string }> }) {
  await requireAdmin();
  const [coupons, { creado }] = await Promise.all([listCoupons(), searchParams]);
  const now = new Date();

  return (
    <>
      <PageHeader title="Cupones">
        <Link href="/admin/cupones/nuevo" className={buttonStyles("primary")}>
          Nuevo cupón
        </Link>
      </PageHeader>
      {creado && (
        <p role="status" className="mb-4 rounded-md border border-state-success p-3 text-state-success">
          Creamos el cupón.
        </p>
      )}
      <ScrollRegion label="Cupones de descuento">
        <table className={table.table}>
          <caption className="sr-only">Cupones de descuento</caption>
          <thead className={table.head}>
            <tr>
              <th scope="col" className={table.th}>Código</th>
              <th scope="col" className={table.th}>Descuento</th>
              <th scope="col" className={table.th}>Vigencia</th>
              <th scope="col" className={`${table.th} text-right`}>Usos</th>
              <th scope="col" className={table.th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 && <EmptyRow colSpan={5}>Todavía no hay cupones.</EmptyRow>}
            {coupons.map((c) => {
              const expired = c.endsAt && c.endsAt < now;
              const upcoming = c.startsAt && c.startsAt > now;
              const exhausted = c.usageLimit !== null && c.usedCount >= c.usageLimit;
              const state = !c.isActive ? "Desactivado" : expired ? "Vencido" : upcoming ? "Aún no vigente" : exhausted ? "Agotado" : "Activo";
              return (
                <tr key={c.id} className={table.row}>
                  <th scope="row" className={`${table.td} font-medium`}>
                    <Link href={`/admin/cupones/${c.id}`} className="underline underline-offset-2">
                      {c.code}
                    </Link>
                    {c.minSubtotal > 0 && <span className="block text-sm font-normal text-text-muted">Desde {formatGTQ(c.minSubtotal)}</span>}
                  </th>
                  <td className={table.td}>{couponLabel(c)}</td>
                  <td className={table.td}>
                    {c.startsAt || c.endsAt ? `${c.startsAt ? formatDateTime(c.startsAt).split(",")[0] : "Siempre"} – ${c.endsAt ? formatDateTime(c.endsAt).split(",")[0] : "sin fin"}` : "Sin fechas"}
                  </td>
                  <td className={`${table.td} text-right`}>
                    {c.usedCount}
                    {c.usageLimit !== null && <span className="text-text-muted"> de {c.usageLimit}</span>}
                  </td>
                  <td className={table.td}>
                    <span className={state === "Activo" ? "text-state-success" : "text-text-muted"}>{state}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollRegion>
    </>
  );
}

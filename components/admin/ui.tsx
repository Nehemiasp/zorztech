import { cn } from "@/lib/cn";
import { statusLabel } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/generated/prisma/client";

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl">{title}</h1>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}

const tone: Record<OrderStatus, string> = {
  pendiente_pago: "border-state-warning text-state-warning",
  pago_fallido: "border-state-error text-state-error",
  expirado: "border-border-strong text-text-muted",
  pagado: "border-state-success text-state-success",
  en_preparacion: "border-state-info text-state-info",
  enviado: "border-state-info text-state-info",
  listo_para_recoger: "border-state-info text-state-info",
  entregado: "border-state-success text-state-success",
  cancelado: "border-border-strong text-text-muted",
  reembolsado: "border-border-strong text-text-muted",
};

/** Estado del pedido: el texto siempre acompaña al color. */
export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={cn("inline-block whitespace-nowrap rounded-sm border px-2 py-0.5 text-sm", tone[status])}>{statusLabel[status]}</span>;
}

export function Panel({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-lg border border-border p-5", className)}>
      {title && <h2 className="mb-3 text-lg">{title}</h2>}
      {children}
    </section>
  );
}

export const table = {
  // "relative" hace que el scroll recorte también los textos sr-only (posición absoluta) de las celdas.
  wrap: "relative overflow-x-auto rounded-lg border border-border",
  table: "w-full min-w-[32rem] text-left",
  head: "border-b border-border bg-surface-light-alt text-sm text-text-muted",
  th: "px-4 py-3 font-medium",
  td: "px-4 py-3 align-top",
  row: "border-b border-border last:border-b-0",
};

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-text-muted">
        {children}
      </td>
    </tr>
  );
}

/** Contenedor de una tabla ancha: se puede recorrer con el teclado y lectores de pantalla lo anuncian por su nombre. */
export function ScrollRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className={table.wrap}>
      {children}
    </div>
  );
}

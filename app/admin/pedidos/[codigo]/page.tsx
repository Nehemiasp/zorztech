import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoteForm, StatusActions, type StatusOption } from "@/components/admin/order-actions";
import { Panel, StatusBadge, table, ScrollRegion } from "@/components/admin/ui";
import { OrderSummary } from "@/components/orders/order-summary";
import { getAdminOrder } from "@/lib/admin/orders";
import { requireAdmin } from "@/lib/auth/guards";
import { formatGTQ } from "@/lib/money";
import { normalizeOrderCode } from "@/lib/orders/code";
import { formatDateTime } from "@/lib/orders/queries";
import { allowedTransitions, statusLabel } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/generated/prisma/client";

export const metadata: Metadata = { title: "Pedido" };

// Lo que el panel ofrece hacer a mano. "Pago fallido" y "Expirado" los pone el sistema, no una persona.
const manual: Partial<Record<OrderStatus, Omit<StatusOption, "to">>> = {
  pagado: { label: "Marcar como pagado" },
  en_preparacion: { label: "Empezar a preparar" },
  enviado: { label: "Marcar como enviado" },
  listo_para_recoger: { label: "Marcar listo para recoger" },
  entregado: { label: "Marcar como entregado" },
  cancelado: { label: "Cancelar pedido", confirm: "El pedido se cancela y los productos vuelven al inventario. Si ya estaba pagado, después podrás reembolsarlo." },
  reembolsado: { label: "Reembolsar", confirm: "Se registra la devolución del dinero y el cliente recibe un correo. Esta acción no se puede deshacer." },
};

const eventLabel: Record<string, string> = { creado: "Pedido creado", estado: "Cambio de estado", pago: "Pago", nota: "Nota interna", alerta: "Alerta" };

export default async function AdminOrderPage({ params }: { params: Promise<{ codigo: string }> }) {
  await requireAdmin();
  const order = await getAdminOrder(normalizeOrderCode((await params).codigo));
  if (!order) notFound();

  const options: StatusOption[] = allowedTransitions(order.status)
    .filter((to) => manual[to])
    .map((to) => ({ to, ...manual[to]! }));
  const payment = order.payments[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm">
          <Link href="/admin/pedidos" className="text-brand-primary-strong underline underline-offset-2">
            Pedidos
          </Link>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl">Pedido {order.code}</h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-text-muted">Creado el {formatDateTime(order.createdAt)}{order.paidAt ? ` · Pagado el ${formatDateTime(order.paidAt)}` : ""}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-6">
          <Panel>
            <OrderSummary order={order} />
          </Panel>

          <Panel title="Historial">
            <ScrollRegion label="Historial del pedido">
              <table className={table.table}>
                <caption className="sr-only">Historial del pedido</caption>
                <thead className={table.head}>
                  <tr>
                    <th scope="col" className={table.th}>Fecha</th>
                    <th scope="col" className={table.th}>Evento</th>
                    <th scope="col" className={table.th}>Detalle</th>
                    <th scope="col" className={table.th}>Quién</th>
                  </tr>
                </thead>
                <tbody>
                  {order.events.map((e) => (
                    <tr key={e.id} className={table.row}>
                      <td className={table.td}>{formatDateTime(e.createdAt)}</td>
                      <td className={table.td}>
                        {eventLabel[e.type] ?? e.type}
                        {e.toStatus && (
                          <span className="block text-sm text-text-muted">
                            {e.fromStatus ? `${statusLabel[e.fromStatus]} → ` : ""}
                            {statusLabel[e.toStatus]}
                          </span>
                        )}
                      </td>
                      <td className={`${table.td} ${e.type === "alerta" ? "text-state-error" : ""}`}>{e.note ?? "—"}</td>
                      <td className={table.td}>{e.actorId ? (order.actorNames[e.actorId] ?? "Administrador") : "Sistema"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollRegion>
          </Panel>
        </div>

        <div className="min-w-0 space-y-6">
          <Panel title="Cambiar estado">
            <StatusActions code={order.code} options={options} />
          </Panel>

          <Panel title="Cliente">
            <p>
              {order.customerName}
              <br />
              <a href={`mailto:${order.email}`} className="text-brand-primary-strong underline underline-offset-2">
                {order.email}
              </a>
              <br />
              {order.phone}
            </p>
            {order.user ? (
              <p className="mt-2 text-sm text-text-muted">
                Con cuenta:{" "}
                <Link href={`/admin/clientes/${order.user.id}`} className="text-brand-primary-strong underline underline-offset-2">
                  {order.user.name}
                </Link>
              </p>
            ) : (
              <p className="mt-2 text-sm text-text-muted">Compra como invitado.</p>
            )}
          </Panel>

          <Panel title="Pago">
            {payment ? (
              <dl className="space-y-1">
                <div className="flex justify-between gap-3"><dt className="text-text-muted">Proveedor</dt><dd>{payment.provider}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-text-muted">Estado</dt><dd>{payment.status}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-text-muted">Monto</dt><dd>{formatGTQ(payment.amount)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-text-muted">Referencia</dt><dd className="break-all text-right">{payment.providerRef}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-text-muted">Intentos</dt><dd>{order.payments.length}</dd></div>
              </dl>
            ) : (
              <p className="text-text-muted">Sin pagos registrados.</p>
            )}
            {order.coupon && <p className="mt-3 text-sm text-text-muted">Cupón usado: {order.coupon.code}</p>}
            {order.notes && <p className="mt-3 text-sm text-text-muted">Nota del cliente: {order.notes}</p>}
          </Panel>

          <Panel title="Notas internas">
            <NoteForm code={order.code} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

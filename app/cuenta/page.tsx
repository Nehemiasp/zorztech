import Link from "next/link";
import { logoutAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatGTQ } from "@/lib/money";
import { formatDateTime } from "@/lib/orders/queries";
import { statusLabel } from "@/lib/orders/status";
import { buttonStyles } from "@/components/ui/button";

export default async function AccountPage() {
  const user = (await getCurrentUser())!;
  const [orders, addressCount] = await Promise.all([
    db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3, select: { code: true, createdAt: true, status: true, total: true } }),
    db.address.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section aria-labelledby="ultimos-pedidos">
        <h2 id="ultimos-pedidos" className="text-xl">
          Últimos pedidos
        </h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-text-muted">
            Aún no tienes pedidos. <Link href="/" className="text-brand-primary-strong underline underline-offset-2">Explora la tienda</Link>.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
            {orders.map((o) => (
              <li key={o.code}>
                <Link href={`/cuenta/pedidos/${o.code}`} className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-surface-light-alt">
                  <span>
                    <span className="block font-medium">{o.code}</span>
                    <span className="text-sm text-text-muted">{formatDateTime(o.createdAt)}</span>
                  </span>
                  <span className="text-right">
                    <span className="block">{formatGTQ(o.total)}</span>
                    <span className="text-sm text-text-muted">{statusLabel[o.status]}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {orders.length > 0 && (
          <p className="mt-3">
            <Link href="/cuenta/pedidos" className="text-brand-primary-strong underline underline-offset-2">
              Ver todos mis pedidos
            </Link>
          </p>
        )}
      </section>

      <section aria-labelledby="mis-datos" className="space-y-3">
        <h2 id="mis-datos" className="text-xl">
          Mis datos
        </h2>
        <p className="text-text-muted">
          {user.name}
          <br />
          {user.email}
          <br />
          {addressCount === 0 ? "Sin direcciones guardadas" : `${addressCount} ${addressCount === 1 ? "dirección guardada" : "direcciones guardadas"}`}
        </p>
        <p className="flex flex-wrap gap-x-6">
          <Link href="/cuenta/datos" className="inline-flex min-h-11 items-center text-brand-primary-strong underline underline-offset-2">
            Editar mis datos y contraseña
          </Link>
          <Link href="/cuenta/direcciones" className="inline-flex min-h-11 items-center text-brand-primary-strong underline underline-offset-2">
            Mis direcciones
          </Link>
          {user.role === "admin" && (
            <Link href="/admin" className="inline-flex min-h-11 items-center text-brand-primary-strong underline underline-offset-2">
              Panel de administración
            </Link>
          )}
        </p>
        <form action={logoutAction}>
          <button type="submit" className={buttonStyles("secondary-light")}>
            Cerrar sesión
          </button>
        </form>
      </section>
    </div>
  );
}

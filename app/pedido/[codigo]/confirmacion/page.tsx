import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OrderSummary } from "@/components/orders/order-summary";
import { AutoRefresh, RetryPaymentButton } from "@/components/orders/payment-actions";
import { LinkButton } from "@/components/ui/button";
import { hasOrderAccess } from "@/lib/orders/access";
import { normalizeOrderCode } from "@/lib/orders/code";
import { expireStaleReservations } from "@/lib/orders/expiry";
import { formatTime, getOrderByCode } from "@/lib/orders/queries";
import { statusDescription } from "@/lib/orders/status";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false, follow: false } };

interface Props {
  params: Promise<{ codigo: string }>;
}

export default async function ConfirmationPage({ params }: Props) {
  const code = normalizeOrderCode((await params).codigo);
  await expireStaleReservations();
  const order = await getOrderByCode(code);
  if (!order) notFound();
  // Sin permiso no se muestra nada del pedido: se invita a consultarlo con código y correo.
  if (!(await hasOrderAccess(order))) redirect(`/pedido/seguimiento?codigo=${encodeURIComponent(code)}`);

  const paymentStatus = order.payments[0]?.status;
  const waiting = order.status === "pendiente_pago" && paymentStatus === "pending";
  const failed = order.status === "pago_fallido" || (order.status === "pendiente_pago" && paymentStatus !== "pending");
  const paid = !["pendiente_pago", "pago_fallido", "expirado", "cancelado"].includes(order.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      {waiting && <AutoRefresh />}

      {paid && (
        <>
          <h1 className="text-2xl md:text-3xl">Gracias por tu compra</h1>
          <p className="mt-3 text-lg">
            Pedido <strong className="font-medium">{order.code}</strong>
          </p>
          <p className="mt-2 text-text-muted">
            {statusDescription[order.status]} Enviamos la confirmación a <strong className="font-medium text-text-on-light">{order.email}</strong>.
          </p>
          <div className="mt-6 rounded-lg bg-surface-light-alt p-5">
            <p className="font-medium">¿Qué sigue?</p>
            <p className="mt-1 text-text-muted">
              {order.shippingMethod === "domicilio"
                ? "Preparamos tu pedido y te avisamos por correo cuando salga hacia tu dirección."
                : "Preparamos tu pedido y te avisamos por correo cuando esté listo para recoger."}{" "}
              Puedes seguirlo en cualquier momento con tu código y tu correo.
            </p>
          </div>
        </>
      )}

      {waiting && (
        <>
          <h1 className="text-2xl md:text-3xl">Estamos esperando la confirmación de tu pago</h1>
          <p className="mt-3 text-lg">
            Pedido <strong className="font-medium">{order.code}</strong>
          </p>
          <p role="status" className="mt-2 text-text-muted">
            Tu proveedor de pago todavía no nos confirma. Esta página se actualiza sola. Apartamos tus productos
            {order.reservationExpiresAt ? ` hasta las ${formatTime(order.reservationExpiresAt)}` : " por unos minutos"}; si el pago se confirma después, te enviamos un correo a {order.email}.
          </p>
          <div className="mt-6">
            <RetryPaymentButton code={order.code} label="Pagar de otra forma" />
          </div>
        </>
      )}

      {failed && (
        <>
          <h1 className="text-2xl md:text-3xl">No pudimos procesar tu pago</h1>
          <p className="mt-3 text-lg">
            Pedido <strong className="font-medium">{order.code}</strong>
          </p>
          <p role="alert" className="mt-2 text-text-muted">
            No se cobró nada. Tus productos siguen apartados
            {order.reservationExpiresAt ? ` hasta las ${formatTime(order.reservationExpiresAt)}` : " por unos minutos"}: puedes intentarlo de nuevo o cambiar la forma de pago.
          </p>
          <div className="mt-6 flex flex-wrap items-start gap-3">
            <RetryPaymentButton code={order.code} />
            <LinkButton href="/carrito" variant="secondary-light">
              Volver al carrito
            </LinkButton>
          </div>
        </>
      )}

      {order.status === "expirado" && (
        <>
          <h1 className="text-2xl md:text-3xl">Tu pedido venció</h1>
          <p className="mt-3 text-lg">
            Pedido <strong className="font-medium">{order.code}</strong>
          </p>
          <p className="mt-2 text-text-muted">{statusDescription.expirado} Tu carrito sigue como lo dejaste: puedes volver a intentarlo.</p>
          <div className="mt-6">
            <LinkButton href="/carrito">Volver al carrito</LinkButton>
          </div>
        </>
      )}

      {order.status === "cancelado" && (
        <>
          <h1 className="text-2xl md:text-3xl">Pedido cancelado</h1>
          <p className="mt-3 text-lg">
            Pedido <strong className="font-medium">{order.code}</strong>
          </p>
          <p className="mt-2 text-text-muted">{statusDescription.cancelado}</p>
        </>
      )}

      <div className="mt-10">
        <OrderSummary order={order} />
      </div>

      <p className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
        <Link href={`/pedido/seguimiento?codigo=${encodeURIComponent(order.code)}`} className="text-brand-primary-strong underline underline-offset-2">
          Seguir mi pedido
        </Link>
        <Link href="/" className="text-brand-primary-strong underline underline-offset-2">
          Seguir comprando
        </Link>
      </p>
    </div>
  );
}

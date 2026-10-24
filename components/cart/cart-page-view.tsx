"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonStyles, LinkButton } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import type { CartView } from "@/lib/cart/types";
import { formatGTQ } from "@/lib/money";
import { CartLines } from "./cart-lines";
import { useCart } from "./cart-provider";

export function CartPageView({ initial }: { initial: CartView }) {
  const { cart: live, ready, hydrate, confirmPrices, busy, notice, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  useEffect(() => hydrate(initial), [hydrate, initial]);
  const cart = ready ? live : initial;

  if (cart.lines.length === 0) {
    return (
      <div className="max-w-xl rounded-lg bg-surface-light-alt p-6 md:p-8">
        <p className="font-display text-xl">Tu carrito está vacío</p>
        <p className="mt-3 text-text-muted">Cuando agregues productos los verás aquí, con su precio y disponibilidad al día.</p>
        <div className="mt-6">
          <LinkButton href="/#categorias">Ver categorías</LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:gap-12">
      <div>
        {cart.priceChanged && (
          <div role="status" className="mb-4 rounded-md border border-state-warning p-4">
            <p className="font-medium">Cambió el precio de algunos productos</p>
            <p className="mt-1 text-text-muted">Revisa los nuevos precios antes de pagar. El total ya los incluye.</p>
            <button
              type="button"
              disabled={busy}
              onClick={confirmPrices}
              className="mt-3 inline-flex min-h-11 items-center rounded-md border border-border-strong px-4 hover:bg-surface-light-alt disabled:opacity-50"
            >
              Entendido
            </button>
          </div>
        )}
        {notice && (
          <p role="status" className="mb-4 rounded-md bg-surface-light-alt p-3">
            {notice}
          </p>
        )}
        <CartLines lines={cart.lines} />
      </div>

      <aside aria-label="Resumen del pedido" className="h-fit rounded-lg bg-surface-light-alt p-5">
        <h2 className="text-lg">Resumen</h2>
        <dl className="mt-4 space-y-2">
          <div className="flex justify-between">
            <dt>Subtotal ({cart.count} {cart.count === 1 ? "producto" : "productos"})</dt>
            <dd className="font-medium">{formatGTQ(cart.subtotal)}</dd>
          </div>
          {cart.discount > 0 && (
            <div className="flex justify-between text-state-success">
              <dt>Descuento</dt>
              <dd>-{formatGTQ(cart.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-text-muted">
            <dt>Envío</dt>
            <dd>Se calcula en el siguiente paso</dd>
          </div>
        </dl>
        <div className="mt-4 border-t border-border pt-4">
          {cart.coupon ? (
            <div className="flex items-start justify-between gap-3">
              <p>
                <span className="font-medium">Cupón {cart.coupon.code}</span>
                <span className="block text-sm text-text-muted">{cart.coupon.label}</span>
              </p>
              <button type="button" disabled={busy} onClick={removeCoupon} className="inline-flex min-h-11 items-center text-brand-primary-strong underline underline-offset-2">
                Quitar<span className="sr-only"> cupón {cart.coupon.code}</span>
              </button>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={async (e) => {
                e.preventDefault();
                setCouponError(null);
                const result = await applyCoupon(code);
                if (result.ok) setCode("");
                else setCouponError(result.message ?? "No pudimos aplicar el cupón.");
              }}
              className="flex items-start gap-2"
            >
              <TextField label="¿Tienes un cupón?" name="cupon" autoComplete="off" autoCapitalize="characters" value={code} onChange={(e) => setCode(e.target.value)} error={couponError ?? undefined} className="min-w-0 flex-1" />
              <button type="submit" disabled={busy || !code.trim()} className={`${buttonStyles("secondary-light")} mt-7`}>
                Aplicar
              </button>
            </form>
          )}
          {cart.couponNotice && (
            <p role="status" className="mt-2 text-sm text-state-warning">
              {cart.couponNotice}
            </p>
          )}
        </div>
        {cart.blocking && (
          <p role="alert" className="mt-4 text-state-error">
            Hay productos que no se pueden comprar con esa cantidad. Corrígelos para continuar.
          </p>
        )}
        <div className="mt-6 grid gap-2">
          <LinkButton href="/checkout" aria-disabled={cart.blocking}>
            Continuar al pago
          </LinkButton>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center text-brand-primary-strong underline underline-offset-2">
            Seguir comprando
          </Link>
        </div>
      </aside>
    </div>
  );
}

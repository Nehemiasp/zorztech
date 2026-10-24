"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { formatGTQ } from "@/lib/money";
import { CartLines } from "./cart-lines";
import { useCart } from "./cart-provider";

/** Cajón lateral que se abre al agregar un producto. */
export function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, notice } = useCart();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (drawerOpen && !dialog.open) dialog.showModal();
    if (!drawerOpen && dialog.open) dialog.close();
  }, [drawerOpen]);

  return (
    <dialog
      ref={ref}
      aria-label="Tu carrito"
      onClose={closeDrawer}
      onClick={(e) => {
        if (e.target === ref.current) closeDrawer();
      }}
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-md bg-surface-light p-0 text-text-on-light backdrop:bg-black/50"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <h2 className="text-lg">Tu carrito</h2>
          <button type="button" onClick={closeDrawer} className="inline-flex size-11 items-center justify-center rounded-md hover:bg-surface-light-alt">
            <X aria-hidden size={22} strokeWidth={1.75} />
            <span className="sr-only">Cerrar carrito</span>
          </button>
        </div>

        {notice && (
          <p role="status" className="border-b border-border bg-surface-light-alt px-4 py-2 text-sm">
            {notice}
          </p>
        )}

        <div className="flex-1 overflow-y-auto px-4">
          {cart.lines.length > 0 ? (
            <CartLines lines={cart.lines} onNavigate={closeDrawer} />
          ) : (
            <p className="py-10 text-center text-text-muted">Tu carrito está vacío.</p>
          )}
        </div>

        {cart.lines.length > 0 && (
          <div className="border-t border-border p-4">
            <p className="flex items-baseline justify-between text-lg">
              <span>Subtotal</span>
              <span className="font-medium">{formatGTQ(cart.subtotal)}</span>
            </p>
            {cart.discount > 0 && (
              <p className="flex items-baseline justify-between text-state-success">
                <span>Cupón {cart.coupon?.code}</span>
                <span>-{formatGTQ(cart.discount)}</span>
              </p>
            )}
            <p className="mt-1 text-sm text-text-muted">El envío se calcula en el siguiente paso.</p>
            <div className="mt-4 grid gap-2">
              <LinkButton href="/checkout" onClick={closeDrawer} aria-disabled={cart.blocking}>
                Ir a pagar
              </LinkButton>
              <button
                type="button"
                onClick={closeDrawer}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-strong px-5 hover:bg-surface-light-alt"
              >
                Seguir comprando
              </button>
              <Link href="/carrito" onClick={closeDrawer} className="inline-flex min-h-11 items-center justify-center text-brand-primary-strong underline underline-offset-2">
                Ver carrito completo
              </Link>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}

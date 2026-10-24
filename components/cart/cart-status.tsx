"use client";

import { useCart } from "./cart-provider";

/** Región en vivo: anuncia a los lectores de pantalla lo que pasó con el carrito. */
export function CartStatus() {
  const { notice } = useCart();
  return (
    <p aria-live="polite" className="sr-only">
      {notice}
    </p>
  );
}

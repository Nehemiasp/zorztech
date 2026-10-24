"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { buttonStyles } from "@/components/ui/button";
import { useCart } from "./cart-provider";

interface Props {
  variantId: string;
  productName: string;
  quantity?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function AddToCartButton({ variantId, productName, quantity = 1, disabled, label = "Agregar al carrito", className }: Props) {
  const { add } = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={disabled || pending}
        className={cn(buttonStyles("primary"), className)}
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await add(variantId, quantity, productName);
          if (!result.ok) setError(result.message ?? "No pudimos agregar el producto.");
          setPending(false);
        }}
      >
        {pending ? "Agregando…" : label}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-sm text-state-error">
          {error}
        </p>
      )}
    </>
  );
}

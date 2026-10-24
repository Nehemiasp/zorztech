"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CatalogImage } from "@/components/catalog-image";
import { issueMessage, MAX_PER_LINE, type CartLine } from "@/lib/cart/types";
import { formatGTQ } from "@/lib/money";
import { useCart } from "./cart-provider";

const stepper = "inline-flex size-11 items-center justify-center hover:bg-surface-light-alt disabled:opacity-40";

export function CartLines({ lines, onNavigate }: { lines: CartLine[]; onNavigate?: () => void }) {
  const { setQuantity, remove, busy } = useCart();

  return (
    <ul className="divide-y divide-border">
      {lines.map((line) => {
        const unavailable = line.issues.some((i) => i === "agotado" || i === "no_disponible");
        const max = Math.max(1, Math.min(line.available, MAX_PER_LINE));
        const problems = line.issues.filter((i) => i !== "precio_cambio");
        return (
          <li key={line.id} className="flex gap-4 py-4">
            <div className="size-20 shrink-0 overflow-hidden rounded-md bg-surface-light-alt sm:size-24">
              {line.image && (
                <CatalogImage src={line.image.url} alt="" width={160} height={160} className="size-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/productos/${line.productSlug}`}
                    onClick={onNavigate}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {line.productName}
                  </Link>
                  {line.variantName && <p className="text-sm text-text-muted">{line.variantName}</p>}
                </div>
                <p className="shrink-0 font-medium">{formatGTQ(line.lineTotal)}</p>
              </div>

              <p className="mt-1 text-sm text-text-muted">
                {formatGTQ(line.unitPrice)} c/u
                {line.issues.includes("precio_cambio") && (
                  <>
                    {" "}
                    <s>{formatGTQ(line.priceAtAdd)}</s>
                  </>
                )}
              </p>

              {problems.map((issue) => (
                <p key={issue} role="alert" className="mt-1 text-sm text-state-error">
                  {issue === "stock_insuficiente" && line.available > 0
                    ? `Solo hay ${line.available} ${line.available === 1 ? "unidad disponible" : "unidades disponibles"}. Baja la cantidad para continuar.`
                    : issueMessage[issue]}
                </p>
              ))}
              {line.issues.includes("precio_cambio") && (
                <p className="mt-1 text-sm text-state-warning">
                  {line.unitPrice > line.priceAtAdd ? "El precio subió" : "El precio bajó"} de {formatGTQ(line.priceAtAdd)} a{" "}
                  {formatGTQ(line.unitPrice)}.
                </p>
              )}

              <div className="mt-2 flex items-center justify-between gap-3">
                {!unavailable ? (
                  <div className="inline-flex items-center rounded-md border border-border-strong">
                    <button
                      type="button"
                      className={`${stepper} rounded-l-md`}
                      disabled={busy || line.quantity <= 1}
                      onClick={() => setQuantity(line.id, line.quantity - 1)}
                    >
                      <Minus aria-hidden size={18} strokeWidth={1.75} />
                      <span className="sr-only">Quitar una unidad de {line.productName}</span>
                    </button>
                    <span aria-live="polite" className="min-w-10 border-x border-border-strong px-2 text-center">
                      <span className="sr-only">Cantidad: </span>
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className={`${stepper} rounded-r-md`}
                      disabled={busy || line.quantity >= max}
                      onClick={() => setQuantity(line.id, line.quantity + 1)}
                    >
                      <Plus aria-hidden size={18} strokeWidth={1.75} />
                      <span className="sr-only">Agregar una unidad de {line.productName}</span>
                    </button>
                  </div>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(line.id)}
                  className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-text-muted hover:text-state-error disabled:opacity-40"
                >
                  <Trash2 aria-hidden size={18} strokeWidth={1.75} />
                  Quitar<span className="sr-only"> {line.productName} del carrito</span>
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

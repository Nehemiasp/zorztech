"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { availabilityLabel, type Availability } from "@/lib/availability";
import {
  attributeGroups,
  initialVariant,
  selectAttribute,
  variantSavings,
  withSelectableAttributes,
  type VariantView,
} from "@/lib/catalog/variants";
import { cn } from "@/lib/cn";
import { discountPercent, formatGTQ } from "@/lib/money";
import { Gallery, type GalleryImage } from "./gallery";

interface Props {
  variants: VariantView[];
  images: (GalleryImage & { variantId: string | null })[];
  /** Foto de reserva cuando el producto no tiene ninguna. */
  fallbackImage: GalleryImage;
  initialSku: string | null;
  /** Contenido renderizado en el servidor: título y datos de entrega y garantía. */
  titleSlot: React.ReactNode;
  infoSlot: React.ReactNode;
}

const MAX_QUANTITY = 10;

function availabilityOf(v: VariantView): Availability {
  if (v.available <= 0) return "agotado";
  return v.available <= v.lowStockThreshold ? "ultimas" : "disponible";
}

const availabilityColor: Record<Availability, string> = {
  disponible: "text-state-success",
  ultimas: "text-state-warning",
  agotado: "text-state-error",
};

export function ProductView({ variants: rawVariants, images, fallbackImage, initialSku, titleSlot, infoSlot }: Props) {
  const variants = useMemo(() => withSelectableAttributes(rawVariants), [rawVariants]);
  const groups = useMemo(() => attributeGroups(variants), [variants]);
  const [variant, setVariant] = useState(() => initialVariant(variants, initialSku));
  const [quantity, setQuantity] = useState(1);
  const buyRef = useRef<HTMLButtonElement>(null);
  const [buyVisible, setBuyVisible] = useState(true);

  // La variante elegida queda en la URL para poder compartirla, sin recargar la página.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (variants.length > 1) url.searchParams.set("variante", variant.sku);
    else url.searchParams.delete("variante");
    window.history.replaceState(null, "", url);
  }, [variant.sku, variants.length]);

  // La barra fija del móvil aparece solo cuando el botón principal sale de la pantalla.
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setBuyVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const galleryImages = useMemo(() => {
    const own = images.filter((i) => i.variantId === variant.id);
    const shared = images.filter((i) => i.variantId === null);
    const list = [...own, ...shared].map(({ url, alt }) => ({ url, alt }));
    return list.length > 0 ? list : [fallbackImage];
  }, [images, variant.id, fallbackImage]);

  const availability = availabilityOf(variant);
  const maxQuantity = Math.max(1, Math.min(variant.available, MAX_QUANTITY));
  const quantityValue = Math.min(quantity, maxQuantity);
  const savings = variantSavings(variant);
  const unavailable = availability === "agotado";

  const choose = (key: string, value: string) => {
    setVariant((current) => selectAttribute(variants, current, key, value));
    setQuantity(1);
  };

  const buyLabel = unavailable ? "Agotado" : "Agregar al carrito";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
      {/* key: al cambiar de variante la galería vuelve a la primera foto */}
      <Gallery key={variant.id} images={galleryImages} />

      <div>
        {titleSlot}

        <div className="mt-5">
          <p className="flex flex-wrap items-baseline gap-x-3">
            <span className="text-2xl font-medium">{formatGTQ(variant.price)}</span>
            {variant.compareAtPrice && savings > 0 && (
              <s className="text-lg text-text-muted">{formatGTQ(variant.compareAtPrice)}</s>
            )}
          </p>
          {savings > 0 && variant.compareAtPrice && (
            <p className="mt-1 text-state-success">
              Ahorras {formatGTQ(savings)} ({discountPercent(variant.compareAtPrice, variant.price)} %)
            </p>
          )}
          <p className={cn("mt-2 font-medium", availabilityColor[availability])} aria-live="polite">
            {availabilityLabel[availability]}
          </p>
          <p className="text-sm text-text-muted">SKU: {variant.sku}</p>
        </div>

        {groups.map((group) => (
          <fieldset key={group.key} className="mt-6">
            <legend className="font-medium">
              {group.label}: <span className="font-normal text-text-muted">{variant.attributes[group.key]}</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {group.values.map(({ value, available }) => {
                const checked = variant.attributes[group.key] === value;
                return (
                  <label key={value} className="cursor-pointer">
                    <input
                      type="radio"
                      name={`opcion-${group.key}`}
                      value={value}
                      checked={checked}
                      onChange={() => choose(group.key, value)}
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        "inline-flex min-h-11 items-center gap-2 rounded-md border px-4 transition-colors duration-150 ease-out",
                        "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-primary",
                        checked
                          ? "border-brand-primary bg-surface-light-alt font-medium ring-1 ring-brand-primary"
                          : "border-border-strong hover:bg-surface-light-alt",
                        !available && "text-text-muted",
                      )}
                    >
                      {value}
                      {!available && <span className="text-sm">Agotado</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

        <div className="mt-6 flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="cantidad" className="block font-medium">
              Cantidad
            </label>
            <div className="mt-2 inline-flex items-center rounded-md border border-border-strong">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantityValue - 1))}
                disabled={unavailable || quantityValue <= 1}
                className="inline-flex size-11 items-center justify-center rounded-l-md hover:bg-surface-light-alt disabled:opacity-40"
              >
                <Minus aria-hidden size={18} strokeWidth={1.75} />
                <span className="sr-only">Quitar una unidad</span>
              </button>
              <input
                id="cantidad"
                type="number"
                inputMode="numeric"
                min={1}
                max={maxQuantity}
                value={quantityValue}
                disabled={unavailable}
                onChange={(e) => {
                  const n = Math.floor(Number(e.target.value));
                  if (Number.isFinite(n)) setQuantity(Math.min(maxQuantity, Math.max(1, n)));
                }}
                className="h-11 w-14 border-x border-border-strong bg-transparent text-center [appearance:textfield] disabled:opacity-40 [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setQuantity(Math.min(maxQuantity, quantityValue + 1))}
                disabled={unavailable || quantityValue >= maxQuantity}
                className="inline-flex size-11 items-center justify-center rounded-r-md hover:bg-surface-light-alt disabled:opacity-40"
              >
                <Plus aria-hidden size={18} strokeWidth={1.75} />
                <span className="sr-only">Agregar una unidad</span>
              </button>
            </div>
          </div>

          {/* El carrito llega en la fase 3: hasta entonces el botón se ve pero no actúa. */}
          <button ref={buyRef} type="button" disabled className={cn(buttonStyles("primary"), "min-w-56 flex-1")}>
            {buyLabel}
          </button>
        </div>

        {infoSlot}
      </div>

      <div
        aria-hidden={buyVisible}
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-border bg-surface-light px-4 py-3 transition-transform duration-200 ease-out lg:hidden",
          buyVisible && "translate-y-full",
        )}
      >
        <p className="text-lg font-medium">{formatGTQ(variant.price)}</p>
        <button type="button" disabled tabIndex={buyVisible ? -1 : 0} className={cn(buttonStyles("primary"), "flex-1 sm:flex-none sm:min-w-56")}>
          {buyLabel}
        </button>
      </div>
    </div>
  );
}

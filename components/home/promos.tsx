import Link from "next/link";
import { ArrowRight, Landmark, Truck } from "lucide-react";
import { CatalogImage } from "@/components/catalog-image";
import type { CategoryRail } from "@/lib/catalog/cards";
import { categoryTaglines } from "@/lib/content/home";
import { cn } from "@/lib/cn";
import { formatGTQShort } from "@/lib/money";
import type { ShippingSettings } from "@/lib/shipping";
import type { TransferSettings } from "@/lib/transfer";

/*
 * Banners del inicio armados con datos reales: el precio «desde» sale del catálogo y las fotos son de
 * productos disponibles. Las fotos tienen fondo blanco; con `mix-blend-multiply` se funden con el fondo claro.
 */

/** Categorías que pueden ir en un banner: con algo disponible y al menos una foto, de la más surtida a la menos. */
export function promoCandidates(rails: CategoryRail[]) {
  return rails
    .filter((r) => r.minPrice !== null && r.products.some((p) => p.image && p.availability !== "agotado"))
    .sort((a, b) => b.total - a.total);
}

export function CategoryPromo({
  rail,
  size = "wide",
  tone = "tint",
}: {
  rail: CategoryRail;
  size?: "side" | "wide";
  tone?: "tint" | "light";
}) {
  const { category, minPrice } = rail;
  const images = rail.products.filter((p) => p.image && p.availability !== "agotado").slice(0, 2);
  const tagline = categoryTaglines[category.slug] ?? category.name;
  const side = size === "side";

  return (
    <Link
      href={`/categorias/${category.slug}`}
      className={cn(
        "group relative flex overflow-hidden rounded-lg",
        tone === "tint" ? "bg-surface-tint" : "bg-surface-light-alt",
        side ? "min-h-36 flex-1" : "min-h-52 md:min-h-60",
      )}
    >
      <div className={cn("relative z-10 flex w-[56%] flex-col justify-center", side ? "p-4 lg:p-5" : "p-5 md:p-8")}>
        <p className="text-sm font-medium text-brand-primary-strong">{category.name}</p>
        <h3 className={cn("mt-1 text-text-on-light", side ? "text-lg" : "text-lg md:text-xl")}>{tagline}</h3>
        {minPrice !== null && (
          <p className="mt-2 text-sm text-text-muted">
            Desde <span className="text-lg font-semibold text-text-on-light">{formatGTQShort(minPrice)}</span>
          </p>
        )}
        {!side && (
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-primary-strong">
            Ver todo
            <ArrowRight aria-hidden size={16} className="transition-transform duration-250 ease-out group-hover:translate-x-0.5" />
          </span>
        )}
      </div>

      <div aria-hidden className="relative w-[44%]">
        {images[0]?.image && (
          <CatalogImage
            src={images[0].image.url}
            alt=""
            width={400}
            height={400}
            sizes={side ? "160px" : "(min-width: 1024px) 260px, 45vw"}
            className={cn(
              "absolute right-2 top-1/2 aspect-square -translate-y-1/2 object-contain mix-blend-multiply transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none",
              side ? "w-[92%]" : "w-[88%]",
            )}
          />
        )}
        {!side && images[1]?.image && (
          <CatalogImage
            src={images[1].image.url}
            alt=""
            width={240}
            height={240}
            sizes="(min-width: 1024px) 130px, 22vw"
            className="absolute bottom-2 left-0 aspect-square w-[45%] object-contain mix-blend-multiply"
          />
        )}
      </div>
    </Link>
  );
}

/** Aviso de envío con la tarifa y el tiempo configurados en el panel. */
export function ShippingPromo({ shipping, className }: { shipping: ShippingSettings; className?: string }) {
  const title = shipping.freeFrom > 0 ? `Envío gratis desde ${formatGTQShort(shipping.freeFrom)}` : "Envíos a todo el país";
  const detail = [
    shipping.deliveryTime ? `Entrega en ${shipping.deliveryTime}.` : "",
    shipping.freeFrom > 0 ? `Compras menores: ${formatGTQShort(shipping.flatRate)}.` : `Tarifa única: ${formatGTQShort(shipping.flatRate)}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      href="/envios"
      className={cn(
        "zone-dark promo-glow group relative flex min-h-36 flex-1 items-center gap-4 overflow-hidden rounded-lg bg-surface-dark-alt p-4 text-text-on-dark lg:p-5",
        className,
      )}
    >
      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-dark-raised text-brand-accent">
        <Truck aria-hidden size={24} strokeWidth={1.75} />
      </span>
      <span className="block">
        <span className="flex items-center gap-1 text-lg font-semibold">
          {title}
          <ArrowRight aria-hidden size={18} className="shrink-0 text-brand-accent transition-transform duration-250 ease-out group-hover:translate-x-0.5" />
        </span>
        <span className="mt-1 block text-sm text-text-on-dark-muted">{detail}</span>
      </span>
    </Link>
  );
}

/** Franja de pago por transferencia: solo cuando el dueño la activó en el panel. */
export function TransferPromo({ transfer }: { transfer: TransferSettings }) {
  if (!transfer.enabled) return null;
  return (
    <section aria-labelledby="transferencia-titulo" className="mx-auto max-w-page px-4 py-4 md:px-6">
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface-light-alt p-5 sm:flex-row sm:items-center md:p-6">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-tint text-brand-primary-strong">
          <Landmark aria-hidden size={24} strokeWidth={1.75} />
        </span>
        <div>
          <h2 id="transferencia-titulo" className="text-lg">
            Paga con transferencia bancaria
          </h2>
          <p className="mt-1 text-text-muted">
            Elige «Transferencia» al pagar: te apartamos el pedido {transfer.holdHours} horas mientras haces el depósito
            {transfer.bankName ? ` en ${transfer.bankName}` : ""} y subes tu comprobante.
          </p>
        </div>
      </div>
    </section>
  );
}

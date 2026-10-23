import Link from "next/link";
import { availabilityLabel } from "@/lib/availability";
import { cn } from "@/lib/cn";
import type { ProductCardData } from "@/lib/catalog";
import { discountPercent, formatGTQ } from "@/lib/money";
import { CatalogImage } from "./catalog-image";

const availabilityColor = {
  disponible: "text-state-success",
  ultimas: "text-state-warning",
  agotado: "text-state-error",
} as const;

export function ProductCard({ product }: { product: ProductCardData }) {
  const saving = product.compareAtPrice ? discountPercent(product.compareAtPrice, product.price) : 0;

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-md bg-surface-light-alt">
        {product.image && (
          <CatalogImage
            src={product.image.url}
            alt={product.image.alt}
            width={600}
            height={600}
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
            className="size-full object-cover"
          />
        )}
        {product.isSample && (
          <span className="absolute left-2 top-2 rounded-sm bg-surface-dark-alt px-2 py-0.5 text-sm text-text-on-dark">
            Producto de ejemplo
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        {product.brand && <p className="text-sm text-text-muted">{product.brand}</p>}
        <h3 className="text-base font-medium leading-snug">
          <Link
            href={`/productos/${product.slug}`}
            className="rounded-sm after:absolute after:inset-0 group-hover:underline"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-medium">
            {product.hasPriceRange && <span className="text-sm font-normal text-text-muted">Desde </span>}
            {formatGTQ(product.price)}
          </span>
          {product.compareAtPrice && saving > 0 && (
            <>
              <s className="text-sm text-text-muted">{formatGTQ(product.compareAtPrice)}</s>
              <span className="text-sm text-state-success">{saving} % menos</span>
            </>
          )}
        </p>

        <p className={cn("text-sm", availabilityColor[product.availability])}>
          {availabilityLabel[product.availability]}
        </p>
      </div>
    </article>
  );
}

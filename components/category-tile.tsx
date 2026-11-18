import Link from "next/link";
import type { CategoryTileData } from "@/lib/catalog/cards";
import { CatalogImage } from "./catalog-image";

/** Categoría como círculo con su foto y el nombre debajo. Las fotos de fondo claro se funden con el círculo. */
export function CategoryTile({ category }: { category: CategoryTileData }) {
  return (
    <Link href={`/categorias/${category.slug}`} className="group flex flex-col items-center rounded-sm text-center">
      <div className="aspect-square w-full overflow-hidden rounded-full bg-surface-tint transition-shadow duration-250 ease-out group-hover:ring-2 group-hover:ring-brand-primary">
        {category.image && (
          <CatalogImage
            src={category.image}
            alt=""
            width={400}
            height={400}
            sizes="(min-width: 1024px) 140px, (min-width: 640px) 18vw, 28vw"
            className="size-full object-cover mix-blend-multiply"
          />
        )}
      </div>
      <span className="mt-2 block text-sm font-medium leading-snug group-hover:underline md:text-base">{category.name}</span>
    </Link>
  );
}

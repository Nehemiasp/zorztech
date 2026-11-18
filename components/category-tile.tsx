import Link from "next/link";
import type { CategoryTileData } from "@/lib/catalog/cards";
import { CatalogImage } from "./catalog-image";

export function CategoryTile({ category }: { category: CategoryTileData }) {
  return (
    <Link href={`/categorias/${category.slug}`} className="group block rounded-sm">
      <div className="cut-corner aspect-[4/3] overflow-hidden bg-surface-light-alt">
        {category.image && (
          <CatalogImage
            src={category.image}
            alt=""
            width={800}
            height={600}
            sizes="(min-width: 1024px) 12vw, (min-width: 640px) 20vw, 30vw"
            className="size-full object-cover"
          />
        )}
      </div>
      <span className="mt-2 block font-medium leading-snug group-hover:underline">{category.name}</span>
    </Link>
  );
}

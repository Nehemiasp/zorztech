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
            sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
            className="size-full object-cover"
          />
        )}
      </div>
      <span className="mt-3 block text-lg font-medium group-hover:underline">{category.name}</span>
    </Link>
  );
}

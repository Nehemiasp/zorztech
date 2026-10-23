import { cache } from "react";
import { db } from "../db";
import { availableUnits } from "../availability";
import { cardSelect, toCard, type ProductCardData } from "./cards";
import type { VariantView } from "./variants";

export const getProductBySlug = cache(async (slug: string) => {
  const product = await db.product.findFirst({
    where: { slug, isActive: true, category: { isActive: true } },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      specs: true,
      isSample: true,
      brand: { select: { name: true, slug: true } },
      category: {
        select: { id: true, name: true, slug: true, parentId: true, parent: { select: { name: true, slug: true } } },
      },
      variants: {
        where: { isActive: true },
        orderBy: { id: "asc" },
        select: {
          id: true,
          sku: true,
          name: true,
          attributes: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          reservedStock: true,
          lowStockThreshold: true,
        },
      },
      images: { orderBy: { order: "asc" }, select: { url: true, alt: true, variantId: true } },
    },
  });
  // Un producto sin variantes activas no se puede comprar ni mostrar con precio.
  if (!product || product.variants.length === 0) return null;

  const variants: VariantView[] = product.variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    name: v.name,
    attributes: Object.fromEntries(
      Object.entries((v.attributes ?? {}) as Record<string, unknown>).map(([k, val]) => [k, String(val)]),
    ),
    price: v.price,
    compareAtPrice: v.compareAtPrice,
    available: availableUnits(v),
    lowStockThreshold: v.lowStockThreshold,
  }));

  const specs = (Array.isArray(product.specs) ? product.specs : []).flatMap((s) => {
    const row = s as { clave?: unknown; valor?: unknown };
    return typeof row.clave === "string" && typeof row.valor === "string" ? [{ clave: row.clave, valor: row.valor }] : [];
  });

  return { ...product, variants, specs };
});

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

/** Misma categoría primero; si faltan, completa con las de su familia (categoría principal y subcategorías). */
export async function getRelatedProducts(product: ProductDetail, limit = 4): Promise<ProductCardData[]> {
  const base = { isActive: true, id: { not: product.id }, category: { isActive: true }, variants: { some: { isActive: true } } };
  const same = await db.product.findMany({
    where: { ...base, categoryId: product.category.id },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: cardSelect,
  });

  let rows = same;
  if (rows.length < limit) {
    const rootId = product.category.parentId ?? product.category.id;
    const family = await db.category.findMany({
      where: { OR: [{ id: rootId }, { parentId: rootId }], isActive: true },
      select: { id: true },
    });
    const more = await db.product.findMany({
      where: { ...base, categoryId: { in: family.map((c) => c.id), not: product.category.id } },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: limit - rows.length,
      select: cardSelect,
    });
    rows = [...rows, ...more];
  }
  return rows.map(toCard).filter((p): p is ProductCardData => p !== null);
}

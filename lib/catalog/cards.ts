import { db } from "../db";
import { coverFirst } from "./cover";
import { productAvailability, type Availability } from "../availability";

export interface CategoryTileData {
  id: string;
  name: string;
  slug: string;
  image: string | null;
}

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  isSample: boolean;
  image: { url: string; alt: string } | null;
  /** Precio más bajo entre las variantes activas, en centavos. */
  price: number;
  compareAtPrice: number | null;
  hasPriceRange: boolean;
  availability: Availability;
}

export async function getNavCategories(): Promise<CategoryTileData[]> {
  return db.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { order: "asc" },
    select: { id: true, name: true, slug: true, image: true },
  });
}

export const cardSelect = {
  id: true,
  slug: true,
  name: true,
  isSample: true,
  brand: { select: { name: true } },
  // En las tarjetas solo van fotos del producto, no las propias de una variante.
  images: { orderBy: coverFirst, take: 1, select: { url: true, alt: true } },
  variants: {
    where: { isActive: true },
    select: { id: true, price: true, compareAtPrice: true, stock: true, reservedStock: true, lowStockThreshold: true },
  },
} as const;

export type CardRow = {
  id: string;
  slug: string;
  name: string;
  isSample: boolean;
  brand: { name: string } | null;
  images: { url: string; alt: string }[];
  variants: {
    id: string;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    reservedStock: number;
    lowStockThreshold: number;
  }[];
};

export function toCard(p: CardRow): ProductCardData | null {
  if (p.variants.length === 0) return null;
  const cheapest = p.variants.reduce((a, b) => (b.price < a.price ? b : a));
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand?.name ?? null,
    isSample: p.isSample,
    image: p.images[0] ?? null,
    price: cheapest.price,
    compareAtPrice: cheapest.compareAtPrice,
    hasPriceRange: p.variants.some((v) => v.price !== cheapest.price),
    availability: productAvailability(p.variants),
  };
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  const rows = await db.product.findMany({
    where: { isActive: true, isFeatured: true, category: { isActive: true } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard).filter((p): p is ProductCardData => p !== null);
}

/** Últimos productos activos agregados al catálogo. `exclude` evita repetir los que ya salen como destacados. */
export async function getNewArrivals(limit = 8, exclude: string[] = []): Promise<ProductCardData[]> {
  const rows = await db.product.findMany({
    where: { isActive: true, category: { isActive: true }, id: { notIn: exclude } },
    orderBy: [{ createdAt: "desc" }, { name: "asc" }],
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard).filter((p): p is ProductCardData => p !== null);
}

export interface CategoryRail {
  category: CategoryTileData;
  products: ProductCardData[];
  /** Productos activos de la categoría (no solo los de la fila). */
  total: number;
  /** Precio más bajo entre lo disponible, en centavos; null si todo está agotado. */
  minPrice: number | null;
}

/**
 * Una fila por categoría principal (con sus subcategorías) para el inicio, en el orden del panel.
 * Lo disponible va primero y lo agotado al final; las categorías sin productos activos no salen.
 */
export async function getCategoryRails(perRail = 10): Promise<CategoryRail[]> {
  const [categories, rows] = await Promise.all([
    db.category.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true, image: true, parentId: true },
    }),
    db.product.findMany({
      where: { isActive: true, category: { isActive: true } },
      orderBy: [{ createdAt: "desc" }, { name: "asc" }],
      take: 500,
      select: { ...cardSelect, categoryId: true },
    }),
  ]);
  const byId = new Map(categories.map((c) => [c.id, c]));
  const topOf = (id: string) => {
    let c = byId.get(id);
    while (c?.parentId) c = byId.get(c.parentId);
    return c;
  };
  const rank = { disponible: 0, ultimas: 0, agotado: 1 } as const;
  const grouped = new Map<string, ProductCardData[]>();
  for (const row of rows) {
    const top = topOf(row.categoryId);
    const card = toCard(row);
    if (!top || top.parentId || !card) continue;
    grouped.set(top.id, [...(grouped.get(top.id) ?? []), card]);
  }
  return categories
    .filter((c) => c.parentId === null && grouped.has(c.id))
    .map((c) => {
      const all = grouped.get(c.id)!;
      const available = all.filter((p) => p.availability !== "agotado");
      return {
        category: { id: c.id, name: c.name, slug: c.slug, image: c.image },
        products: all
          .map((p, i) => ({ p, i }))
          .sort((a, b) => rank[a.p.availability] - rank[b.p.availability] || a.i - b.i)
          .slice(0, perRail)
          .map(({ p }) => p),
        total: all.length,
        minPrice: available.length ? Math.min(...available.map((p) => p.price)) : null,
      };
    });
}

/** Más vendidos según pedidos pagados reales. Sin ventas devuelve una lista vacía y la sección se oculta. */
export async function getBestSellers(limit = 4): Promise<ProductCardData[]> {
  const sold = await db.$queryRaw<{ productId: string }[]>`
    SELECT v."productId" AS "productId"
    FROM order_items oi
    JOIN orders o ON o.id = oi."orderId"
    JOIN product_variants v ON v.id = oi."variantId"
    WHERE o.status IN ('pagado', 'en_preparacion', 'enviado', 'listo_para_recoger', 'entregado')
    GROUP BY v."productId"
    ORDER BY SUM(oi.quantity) DESC
    LIMIT ${limit}
  `;
  if (sold.length === 0) return [];
  const ids = sold.map((s) => s.productId);
  const rows = await db.product.findMany({
    where: { id: { in: ids }, isActive: true },
    select: cardSelect,
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids
    .map((id) => byId.get(id))
    .filter((r): r is CardRow => r !== undefined)
    .map(toCard)
    .filter((p): p is ProductCardData => p !== null);
}

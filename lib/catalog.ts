import { db } from "./db";
import { productAvailability, type Availability } from "./availability";

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

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  isSample: true,
  brand: { select: { name: true } },
  images: { orderBy: { order: "asc" }, take: 1, select: { url: true, alt: true } },
  variants: {
    where: { isActive: true },
    select: { price: true, compareAtPrice: true, stock: true, reservedStock: true, lowStockThreshold: true },
  },
} as const;

type CardRow = {
  id: string;
  slug: string;
  name: string;
  isSample: boolean;
  brand: { name: string } | null;
  images: { url: string; alt: string }[];
  variants: {
    price: number;
    compareAtPrice: number | null;
    stock: number;
    reservedStock: number;
    lowStockThreshold: number;
  }[];
};

function toCard(p: CardRow): ProductCardData | null {
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

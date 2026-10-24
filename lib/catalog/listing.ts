import { sweepIfDue } from "../orders/expiry";
import { cache } from "react";
import { Prisma } from "../generated/prisma/client";
import { db } from "../db";
import { normalizeText, searchTokens } from "../search";
import { cardSelect, toCard, type CardRow, type ProductCardData } from "./cards";
import { PAGE_SIZE, attributeLabel, type ListingFilters } from "./params";

/** Qué productos se están listando: una categoría (con sus subcategorías) o una búsqueda. */
export interface Scope {
  categoryIds?: string[];
  q?: string;
}

export const getCategoryBySlug = cache(async (slug: string) =>
  db.category.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      image: true,
      parent: { select: { name: true, slug: true } },
      children: { where: { isActive: true }, orderBy: { order: "asc" }, select: { id: true, name: true, slug: true } },
    },
  }),
);

export type CategoryDetail = NonNullable<Awaited<ReturnType<typeof getCategoryBySlug>>>;

export function categoryScope(category: CategoryDetail): Scope {
  return { categoryIds: [category.id, ...category.children.map((c) => c.id)] };
}

// --- SQL -------------------------------------------------------------------------------------
// El precio más bajo y las unidades vendibles salen de las variantes activas de cada producto.

const FROM = Prisma.sql`
  FROM products p
  JOIN categories c ON c.id = p."categoryId"
  LEFT JOIN brands b ON b.id = p."brandId"
  JOIN LATERAL (
    SELECT MIN(v.price) AS min_price,
           COALESCE(SUM(GREATEST(v.stock - v."reservedStock", 0)), 0)::int AS available,
           COUNT(*)::int AS n
    FROM product_variants v
    WHERE v."productId" = p.id AND v."isActive"
  ) agg ON agg.n > 0`;

function scopeConditions(scope: Scope): Prisma.Sql[] {
  const conditions = [Prisma.sql`p."isActive" AND c."isActive"`];
  if (scope.categoryIds?.length) {
    conditions.push(Prisma.sql`p."categoryId" IN (${Prisma.join(scope.categoryIds)})`);
  }
  for (const token of searchTokens(scope.q ?? "")) {
    conditions.push(Prisma.sql`strpos(p."searchText", ${token}) > 0`);
  }
  return conditions;
}

function filterConditions(f: ListingFilters): Prisma.Sql[] {
  const conditions: Prisma.Sql[] = [];
  if (f.categoria.length) {
    // Una categoría principal incluye los productos de sus subcategorías.
    conditions.push(Prisma.sql`(
      c.slug IN (${Prisma.join(f.categoria)})
      OR c."parentId" IN (SELECT id FROM categories WHERE slug IN (${Prisma.join(f.categoria)}))
    )`);
  }
  if (f.marca.length) conditions.push(Prisma.sql`b.slug IN (${Prisma.join(f.marca)})`);
  if (f.desde !== null) conditions.push(Prisma.sql`agg.min_price >= ${f.desde * 100}`);
  if (f.hasta !== null) conditions.push(Prisma.sql`agg.min_price <= ${f.hasta * 100}`);
  if (f.disponibles) conditions.push(Prisma.sql`agg.available > 0`);

  const attributes = Object.entries(f.atributos);
  if (attributes.length) {
    // Todos los atributos elegidos deben cumplirse en la misma variante.
    const matches = attributes.map(
      ([key, values]) => Prisma.sql`v2.attributes ->> ${key}::text IN (${Prisma.join(values)})`,
    );
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM product_variants v2
      WHERE v2."productId" = p.id AND v2."isActive" AND ${Prisma.join(matches, " AND ")}
    )`);
  }
  return conditions;
}

function orderBy(scope: Scope, f: ListingFilters): Prisma.Sql {
  switch (f.orden) {
    case "precio-asc":
      return Prisma.sql`agg.min_price ASC, p.id`;
    case "precio-desc":
      return Prisma.sql`agg.min_price DESC, p.id`;
    case "nuevos":
      return Prisma.sql`p."createdAt" DESC, p.id`;
    default: {
      const phrase = normalizeText(scope.q ?? "");
      if (phrase) {
        // La frase completa cerca del inicio (el nombre) pesa más que una coincidencia en la descripción.
        return Prisma.sql`
          CASE WHEN strpos(p."searchText", ${phrase}) > 0 THEN strpos(p."searchText", ${phrase}) ELSE 100000 END,
          p."isFeatured" DESC, p."createdAt" DESC, p.id`;
      }
      return Prisma.sql`p."isFeatured" DESC, p."createdAt" DESC, p.id`;
    }
  }
}

const where = (conditions: Prisma.Sql[]) => Prisma.join(conditions, " AND ");

// --- Listado ---------------------------------------------------------------------------------

export interface ListingResult {
  items: ProductCardData[];
  total: number;
  page: number;
  pageCount: number;
}

export async function listProducts(scope: Scope, filters: ListingFilters): Promise<ListingResult> {
  await sweepIfDue(); // sin cron frecuente, la disponibilidad que se muestra no puede depender de reservas vencidas
  const conditions = where([...scopeConditions(scope), ...filterConditions(filters)]);
  const offset = (filters.pagina - 1) * PAGE_SIZE;

  const [rows, counted] = await Promise.all([
    db.$queryRaw<{ id: string }[]>`
      SELECT p.id ${FROM} WHERE ${conditions}
      ORDER BY ${orderBy(scope, filters)} LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
    db.$queryRaw<{ total: number }[]>`SELECT COUNT(*)::int AS total ${FROM} WHERE ${conditions}`,
  ]);

  const total = counted[0]?.total ?? 0;
  const ids = rows.map((r) => r.id);
  const products = ids.length ? await db.product.findMany({ where: { id: { in: ids } }, select: cardSelect }) : [];
  const byId = new Map(products.map((p) => [p.id, p]));
  const items = ids
    .map((id) => byId.get(id))
    .filter((p): p is CardRow => p !== undefined)
    .map(toCard)
    .filter((p): p is ProductCardData => p !== null);

  return { items, total, page: filters.pagina, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

// --- Opciones de filtro ----------------------------------------------------------------------

export interface Facets {
  marcas: { slug: string; name: string }[];
  atributos: { key: string; label: string; values: string[] }[];
}

const naturalOrder = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

/** Marcas y atributos disponibles dentro del alcance, sin tener en cuenta los filtros ya elegidos. */
export async function getFacets(scope: Scope): Promise<Facets> {
  const conditions = where(scopeConditions(scope));
  const [brands, attrs] = await Promise.all([
    db.$queryRaw<{ slug: string; name: string }[]>`
      SELECT DISTINCT b.slug, b.name ${FROM} WHERE ${conditions} AND b.id IS NOT NULL ORDER BY b.name`,
    db.$queryRaw<{ key: string; value: string }[]>`
      SELECT DISTINCT kv.key, kv.value
      ${FROM}
      JOIN product_variants v ON v."productId" = p.id AND v."isActive"
      CROSS JOIN LATERAL jsonb_each_text(v.attributes) kv
      WHERE ${conditions}`,
  ]);

  const grouped = new Map<string, string[]>();
  for (const { key, value } of attrs) grouped.set(key, [...(grouped.get(key) ?? []), value]);

  return {
    marcas: brands,
    atributos: [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "es"))
      .map(([key, values]) => ({ key, label: attributeLabel(key), values: values.sort(naturalOrder.compare) })),
  };
}

/** Categorías principales que aparecen en los resultados de una búsqueda. */
export async function getSearchCategoryFacets(scope: Scope): Promise<{ slug: string; name: string }[]> {
  return db.$queryRaw<{ slug: string; name: string }[]>`
    SELECT DISTINCT COALESCE(parent.slug, c.slug) AS slug, COALESCE(parent.name, c.name) AS name
    ${FROM}
    LEFT JOIN categories parent ON parent.id = c."parentId"
    WHERE ${where(scopeConditions(scope))}
    ORDER BY name`;
}

// --- Sugerencias del buscador ----------------------------------------------------------------

export interface Suggestions {
  productos: { nombre: string; slug: string; categoria: string }[];
  categorias: { nombre: string; slug: string }[];
}

const activeCategories = cache(async () =>
  db.category.findMany({ where: { isActive: true }, select: { name: true, slug: true } }),
);

export async function suggest(q: string): Promise<Suggestions> {
  const scope: Scope = { q };
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT p.id ${FROM} WHERE ${where(scopeConditions(scope))}
    ORDER BY ${orderBy(scope, { orden: "relevancia" } as ListingFilters)} LIMIT 5`;
  const ids = rows.map((r) => r.id);
  const products = ids.length
    ? await db.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, slug: true, category: { select: { name: true } } },
      })
    : [];
  const byId = new Map(products.map((p) => [p.id, p]));

  const phrase = normalizeText(q);
  const categorias = (await activeCategories())
    .filter((c) => normalizeText(c.name).includes(phrase))
    .slice(0, 2)
    .map((c) => ({ nombre: c.name, slug: c.slug }));

  return {
    productos: ids
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined)
      .map((p) => ({ nombre: p.name, slug: p.slug, categoria: p.category.name })),
    categorias,
  };
}

/** Cantidad de productos y precio más bajo de un alcance, para los textos de SEO. */
export const getScopeSummary = cache(async (categoryIds: string[]) => {
  const rows = await db.$queryRaw<{ total: number; min_price: number | null }[]>`
    SELECT COUNT(*)::int AS total, MIN(agg.min_price)::int AS min_price
    ${FROM} WHERE ${where(scopeConditions({ categoryIds }))}`;
  return { total: rows[0]?.total ?? 0, minPrice: rows[0]?.min_price ?? null };
});

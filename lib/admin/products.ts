import { db } from "../db";
import { Prisma } from "../generated/prisma/client";
import { availableUnits } from "../availability";
import { buildSearchText } from "../search";
import { slugify, uniqueSlug } from "../slug";
import { attributeKey, type ProductInput } from "./product-schema";
import { notifyRestock } from "./stock-alerts";

export const PRODUCTS_PAGE_SIZE = 20;

export interface ProductFilters {
  q: string;
  categoria: string;
  estado: "" | "activos" | "inactivos";
  stockBajo: boolean;
  ejemplo: boolean;
  pagina: number;
}

export function parseProductFilters(raw: Record<string, string | string[] | undefined>): ProductFilters {
  const one = (k: string) => (Array.isArray(raw[k]) ? raw[k]![0] : raw[k]) ?? "";
  const page = Number(one("pagina"));
  return {
    q: one("q").trim().slice(0, 100),
    categoria: one("categoria").slice(0, 40),
    estado: one("estado") === "activos" ? "activos" : one("estado") === "inactivos" ? "inactivos" : "",
    stockBajo: one("stockBajo") === "1",
    ejemplo: one("ejemplo") === "1",
    pagina: Number.isInteger(page) && page >= 1 && page <= 1000 ? page : 1,
  };
}

export async function listAdminProducts(f: ProductFilters) {
  const lowStockIds = f.stockBajo
    ? (
        await db.$queryRaw<{ productId: string }[]>`
          SELECT DISTINCT "productId" FROM product_variants
          WHERE "isActive" AND stock - "reservedStock" <= "lowStockThreshold"`
      ).map((r) => r.productId)
    : null;

  const where: Prisma.ProductWhereInput = {
    ...(f.q ? { OR: [{ name: { contains: f.q, mode: "insensitive" } }, { variants: { some: { sku: { contains: f.q, mode: "insensitive" } } } }] } : {}),
    ...(f.categoria ? { OR: [{ categoryId: f.categoria }, { category: { parentId: f.categoria } }] } : {}),
    ...(f.estado ? { isActive: f.estado === "activos" } : {}),
    ...(f.ejemplo ? { isSample: true } : {}),
    ...(lowStockIds ? { id: { in: lowStockIds } } : {}),
  };
  const [rows, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (f.pagina - 1) * PRODUCTS_PAGE_SIZE,
      take: PRODUCTS_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        isFeatured: true,
        isSample: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        variants: { select: { price: true, stock: true, reservedStock: true, isActive: true, lowStockThreshold: true } },
      },
    }),
    db.product.count({ where }),
  ]);
  return {
    total,
    pageCount: Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE)),
    rows: rows.map((p) => {
      const active = p.variants.filter((v) => v.isActive);
      return {
        ...p,
        variantCount: p.variants.length,
        minPrice: active.length ? Math.min(...active.map((v) => v.price)) : null,
        available: active.reduce((n, v) => n + availableUnits(v), 0),
        lowStock: active.some((v) => availableUnits(v) <= v.lowStockThreshold),
      };
    }),
  };
}

export async function getAdminProduct(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { id: "asc" } },
      images: { orderBy: { order: "asc" } },
    },
  });
}

export async function getFormOptions() {
  const [categories, brands] = await Promise.all([
    db.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true, parentId: true } }),
    db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const roots = categories.filter((c) => !c.parentId);
  const options = roots.flatMap((r) => [
    { id: r.id, name: r.name },
    ...categories.filter((c) => c.parentId === r.id).map((c) => ({ id: c.id, name: `${r.name} › ${c.name}` })),
  ]);
  return { categories: options, brands };
}

export type SaveProductResult =
  | { ok: true; id: string; notices: string[] }
  | { ok: false; fields?: Record<string, string>; message?: string };

/**
 * Crea o actualiza un producto con sus variantes e imágenes en una transacción, y recalcula su
 * texto de búsqueda. Una variante que ya se vendió no se borra: se desactiva.
 */
export async function saveProduct(input: ProductInput): Promise<SaveProductResult> {
  const category = await db.category.findUnique({ where: { id: input.categoryId }, include: { parent: { select: { name: true } } } });
  if (!category) return { ok: false, fields: { categoryId: "Esa categoría ya no existe." } };

  const existing = input.id ? await db.product.findUnique({ where: { id: input.id }, include: { variants: true } }) : null;
  if (input.id && !existing) return { ok: false, message: "Este producto ya no existe." };

  // SKU únicos en toda la tienda.
  const skuOwners = await db.productVariant.findMany({ where: { sku: { in: input.variants.map((v) => v.sku) } }, select: { id: true, sku: true } });
  const fields: Record<string, string> = {};
  input.variants.forEach((v, i) => {
    const owner = skuOwners.find((o) => o.sku === v.sku);
    if (owner && owner.id !== v.id) fields[`variants.${i}.sku`] = "Ya hay otra variante con este SKU.";
  });

  // El stock nunca puede quedar por debajo de lo que ya está apartado en pedidos sin pagar.
  input.variants.forEach((v, i) => {
    const current = existing?.variants.find((x) => x.id === v.id);
    if (current && v.stock < current.reservedStock) {
      fields[`variants.${i}.stock`] = `Hay ${current.reservedStock} unidades apartadas en pedidos sin pagar: el stock no puede ser menor.`;
    }
    if (v.id && !current) fields[`variants.${i}.sku`] = "Esta variante no pertenece al producto.";
  });
  if (Object.keys(fields).length > 0) return { ok: false, fields };

  const slug = input.slug
    ? input.slug
    : await uniqueSlug(slugify(input.name), async (s) => Boolean(await db.product.findFirst({ where: { slug: s, NOT: input.id ? { id: input.id } : undefined }, select: { id: true } })));
  const taken = await db.product.findFirst({ where: { slug, NOT: input.id ? { id: input.id } : undefined }, select: { id: true } });
  if (taken) return { ok: false, fields: { slug: "Ya hay otro producto con esta dirección." } };

  const notices: string[] = [];
  const restocked: string[] = [];

  try {
    const productId = await db.$transaction(async (tx) => {
      let brandId = input.brandId;
      if (input.newBrand) {
        const brandSlug = slugify(input.newBrand) || "marca";
        const brand = await tx.brand.upsert({ where: { slug: brandSlug }, update: {}, create: { name: input.newBrand, slug: brandSlug } });
        brandId = brand.id;
      }

      const data = {
        name: input.name,
        slug,
        brandId,
        categoryId: input.categoryId,
        description: input.description,
        specs: input.specs,
        isActive: input.isActive,
        isFeatured: input.isFeatured,
        isSample: input.isSample,
      };
      const product = existing
        ? await tx.product.update({ where: { id: existing.id }, data })
        : await tx.product.create({ data });

      // Variantes: se actualizan las que existen, se crean las nuevas y se quitan las que ya no están.
      const keptIds = new Set(input.variants.map((v) => v.id).filter((id): id is string => Boolean(id)));
      for (const old of existing?.variants ?? []) {
        if (keptIds.has(old.id)) continue;
        const sold = await tx.orderItem.count({ where: { variantId: old.id } });
        if (sold > 0) {
          await tx.productVariant.update({ where: { id: old.id }, data: { isActive: false } });
          notices.push(`La variante ${old.sku} ya se vendió, así que se desactivó en lugar de borrarse.`);
        } else {
          await tx.productVariant.delete({ where: { id: old.id } });
        }
      }

      const skuToId = new Map<string, string>();
      for (const v of input.variants) {
        const attributes = Object.fromEntries(v.attributes.map((a) => [attributeKey(a.clave), a.valor]));
        const vData = {
          sku: v.sku,
          name: v.name,
          attributes,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stock: v.stock,
          lowStockThreshold: v.lowStockThreshold,
          isActive: v.isActive,
        };
        if (v.id) {
          const before = existing!.variants.find((x) => x.id === v.id)!;
          if (availableUnits(before) <= 0 && v.stock - before.reservedStock > 0 && v.isActive) restocked.push(v.id);
          await tx.productVariant.update({ where: { id: v.id }, data: vData });
          skuToId.set(v.sku, v.id);
        } else {
          const created = await tx.productVariant.create({ data: { ...vData, productId: product.id } });
          skuToId.set(v.sku, created.id);
        }
      }

      await tx.productImage.deleteMany({ where: { productId: product.id } });
      if (input.images.length > 0) {
        await tx.productImage.createMany({
          data: input.images.map((img, order) => ({
            productId: product.id,
            variantId: img.variantSku ? (skuToId.get(img.variantSku) ?? null) : null,
            url: img.url,
            alt: img.alt,
            order,
          })),
        });
      }

      const brand = brandId ? await tx.brand.findUnique({ where: { id: brandId }, select: { name: true } }) : null;
      await tx.product.update({
        where: { id: product.id },
        data: {
          searchText: buildSearchText({
            name: input.name,
            brand: brand?.name,
            categories: [category.parent?.name, category.name].filter((n): n is string => Boolean(n)),
            description: input.description,
            variants: input.variants.map((v) => ({ name: v.name, sku: v.sku })),
          }),
        },
      });
      return product.id;
    });

    await notifyRestock(restocked);
    return { ok: true, id: productId, notices };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "Ya existe un producto o SKU con esos datos. Revisa la dirección y los SKU." };
    }
    throw error;
  }
}

export async function setProductActive(id: string, isActive: boolean): Promise<void> {
  await db.product.update({ where: { id }, data: { isActive } });
}

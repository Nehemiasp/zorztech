import { z } from "zod";
import { db } from "../db";
import { Prisma } from "../generated/prisma/client";
import { buildSearchText } from "../search";
import { slugify, uniqueSlug } from "../slug";
import { isAllowedImageUrl } from "./product-schema";

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Escribe el nombre.").max(60, "Usa hasta 60 caracteres."),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, "Usa minúsculas, números y guiones.")
    .optional(),
  parentId: z.string().nullable(),
  image: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || isAllowedImageUrl(v), "La imagen no es válida. Súbela desde aquí.")
    .optional(),
  isActive: z.boolean(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export async function listCategoryTree() {
  const all = await db.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true, children: true } } },
  });
  return all
    .filter((c) => !c.parentId)
    .map((root) => ({ ...root, children: all.filter((c) => c.parentId === root.id) }));
}

export type SaveCategoryResult = { ok: true; id: string } | { ok: false; fields?: Record<string, string>; message?: string };

/** Las categorías tienen un solo nivel de subcategorías: una subcategoría no puede tener hijas ni una con hijas pasar a ser hija. */
export async function saveCategory(input: CategoryInput): Promise<SaveCategoryResult> {
  const existing = input.id ? await db.category.findUnique({ where: { id: input.id }, include: { _count: { select: { children: true } } } }) : null;
  if (input.id && !existing) return { ok: false, message: "Esta categoría ya no existe." };

  if (input.parentId) {
    if (input.parentId === input.id) return { ok: false, fields: { parentId: "Una categoría no puede ser hija de sí misma." } };
    const parent = await db.category.findUnique({ where: { id: input.parentId } });
    if (!parent) return { ok: false, fields: { parentId: "Esa categoría principal ya no existe." } };
    if (parent.parentId) return { ok: false, fields: { parentId: "Solo se permite un nivel de subcategorías." } };
    if (existing && existing._count.children > 0) return { ok: false, fields: { parentId: "Tiene subcategorías: primero muévelas o quítalas." } };
  }

  const taken = (slug: string) => db.category.findFirst({ where: { slug, NOT: input.id ? { id: input.id } : undefined }, select: { id: true } });
  const slug = input.slug || (await uniqueSlug(slugify(input.name), async (s) => Boolean(await taken(s))));
  if (await taken(slug)) return { ok: false, fields: { slug: "Ya hay otra categoría con esta dirección." } };

  const data = { name: input.name, slug, parentId: input.parentId, image: input.image || null, isActive: input.isActive };
  try {
    if (existing) {
      await db.category.update({ where: { id: existing.id }, data });
      // El nombre de la categoría forma parte del texto de búsqueda de sus productos.
      if (existing.name !== input.name || existing.parentId !== input.parentId) await rebuildSearchText({ categoryIds: [existing.id] });
      return { ok: true, id: existing.id };
    }
    const last = await db.category.aggregate({ where: { parentId: input.parentId }, _max: { order: true } });
    const created = await db.category.create({ data: { ...data, order: (last._max.order ?? -1) + 1 } });
    return { ok: true, id: created.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, fields: { slug: "Ya hay otra categoría con esta dirección." } };
    throw error;
  }
}

/** Sube o baja una categoría entre sus hermanas intercambiando su posición. */
export async function moveCategory(id: string, direction: "up" | "down"): Promise<void> {
  const category = await db.category.findUnique({ where: { id } });
  if (!category) return;
  const siblings = await db.category.findMany({ where: { parentId: category.parentId }, orderBy: [{ order: "asc" }, { name: "asc" }] });
  const index = siblings.findIndex((c) => c.id === id);
  const target = siblings[direction === "up" ? index - 1 : index + 1];
  if (!target) return;
  // Se renumera toda la lista para que dos hermanas con el mismo orden no queden empatadas.
  const reordered = siblings.map((c) => c.id);
  [reordered[index], reordered[reordered.indexOf(target.id)]] = [target.id, id];
  await db.$transaction(reordered.map((cid, order) => db.category.update({ where: { id: cid }, data: { order } })));
}

export async function deleteCategory(id: string): Promise<{ ok: boolean; message: string }> {
  const category = await db.category.findUnique({ where: { id }, include: { _count: { select: { products: true, children: true } } } });
  if (!category) return { ok: false, message: "Esta categoría ya no existe." };
  if (category._count.products > 0) return { ok: false, message: `Tiene ${category._count.products} productos. Muévelos a otra categoría o desactívala.` };
  if (category._count.children > 0) return { ok: false, message: "Tiene subcategorías. Quítalas primero." };
  await db.category.delete({ where: { id } });
  return { ok: true, message: "Borramos la categoría." };
}

/** Recalcula el texto de búsqueda de los productos de unas categorías. */
export async function rebuildSearchText(scope: { categoryIds: string[] }): Promise<void> {
  const products = await db.product.findMany({
    where: { categoryId: { in: scope.categoryIds } },
    select: {
      id: true,
      name: true,
      description: true,
      brand: { select: { name: true } },
      category: { select: { name: true, parent: { select: { name: true } } } },
      variants: { select: { name: true, sku: true } },
    },
  });
  for (const p of products) {
    await db.product.update({
      where: { id: p.id },
      data: {
        searchText: buildSearchText({
          name: p.name,
          brand: p.brand?.name,
          categories: [p.category.parent?.name, p.category.name].filter((n): n is string => Boolean(n)),
          description: p.description,
          variants: p.variants,
        }),
      },
    });
  }
}

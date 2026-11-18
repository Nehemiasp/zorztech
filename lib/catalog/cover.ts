import type { Prisma } from "../generated/prisma/client";

/** Orden para la foto de portada: primero la general del producto y, si solo hay fotos por variante (por ejemplo, por color), la primera de esas. */
export const coverFirst: Prisma.ProductImageOrderByWithRelationInput[] = [{ variantId: { sort: "asc", nulls: "first" } }, { order: "asc" }];

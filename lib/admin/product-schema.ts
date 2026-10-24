import { z } from "zod";
import { parseGTQ } from "../money";

const pair = z.object({
  clave: z.string().trim().min(1, "Escribe el nombre.").max(60, "Usa hasta 60 caracteres."),
  valor: z.string().trim().min(1, "Escribe el valor.").max(200, "Usa hasta 200 caracteres."),
});

/** "Capacidad" → "capacidad"; "Tipo de interruptor" → "tipo_de_interruptor". Es la clave que usan los filtros. */
export function attributeKey(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^\p{L}\p{N}_-]/gu, "").slice(0, 30);
}

const money = (label: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      const cents = parseGTQ(v);
      if (cents === null) ctx.addIssue({ code: "custom", message: `Escribe ${label} en quetzales, por ejemplo 1299.00.` });
      return cents ?? 0;
    });

const variantSchema = z
  .object({
    id: z.string().optional(),
    sku: z
      .string()
      .trim()
      .min(2, "Escribe el SKU.")
      .max(40, "Usa hasta 40 caracteres.")
      .regex(/^[A-Za-z0-9._-]+$/, "Usa letras, números, punto, guion o guion bajo."),
    name: z.string().trim().min(1, "Escribe el nombre de la variante.").max(60, "Usa hasta 60 caracteres."),
    attributes: z.array(pair).max(6, "Usa hasta 6 atributos."),
    price: money("el precio").refine((c) => c > 0, "El precio debe ser mayor que cero."),
    compareAtPrice: z.string().trim().optional(),
    stock: z.coerce.number({ error: "Escribe las unidades." }).int("Usa un número entero.").min(0, "No puede ser negativo.").max(1_000_000),
    lowStockThreshold: z.coerce.number({ error: "Escribe el mínimo." }).int("Usa un número entero.").min(0, "No puede ser negativo.").max(10_000),
    isActive: z.boolean(),
  })
  .transform((v, ctx) => {
    let compareAtPrice: number | null = null;
    if (v.compareAtPrice) {
      const cents = parseGTQ(v.compareAtPrice);
      if (cents === null) ctx.addIssue({ code: "custom", path: ["compareAtPrice"], message: "Escribe el precio anterior en quetzales, por ejemplo 1499.00." });
      else if (cents <= v.price) ctx.addIssue({ code: "custom", path: ["compareAtPrice"], message: "El precio anterior debe ser mayor que el precio actual." });
      else compareAtPrice = cents;
    }
    const keys = v.attributes.map((a) => attributeKey(a.clave));
    if (new Set(keys).size !== keys.length) ctx.addIssue({ code: "custom", path: ["attributes"], message: "Hay atributos repetidos." });
    return { ...v, compareAtPrice };
  });

/** Solo se aceptan imágenes subidas desde el panel o los marcadores del proyecto: nada de enlaces a sitios ajenos. */
export function isAllowedImageUrl(url: string): boolean {
  if (url.startsWith("/api/uploads/") || url.startsWith("/img/placeholder/")) return !url.includes("..");
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

const imageSchema = z.object({
  url: z.string().max(500).refine(isAllowedImageUrl, "La imagen no es válida. Súbela desde aquí."),
  alt: z.string().trim().min(3, "Describe la imagen para quien no puede verla.").max(160, "Usa hasta 160 caracteres."),
  variantSku: z.string().nullable(),
});

export const productSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(2, "Escribe el nombre del producto.").max(120, "Usa hasta 120 caracteres."),
    slug: z
      .string()
      .trim()
      .max(80)
      .regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, "Usa minúsculas, números y guiones.")
      .optional(),
    brandId: z.string().nullable(),
    newBrand: z.string().trim().max(60, "Usa hasta 60 caracteres.").optional(),
    categoryId: z.string().min(1, "Elige una categoría."),
    description: z.string().trim().max(5000, "Usa hasta 5,000 caracteres."),
    specs: z.array(pair).max(40),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    isSample: z.boolean(),
    variants: z.array(variantSchema).min(1, "Agrega al menos una variante.").max(50),
    images: z.array(imageSchema).max(20, "Puedes subir hasta 20 imágenes."),
  })
  .superRefine((p, ctx) => {
    const seen = new Set<string>();
    p.variants.forEach((v, i) => {
      const sku = v.sku.toLowerCase();
      if (seen.has(sku)) ctx.addIssue({ code: "custom", path: ["variants", i, "sku"], message: "Este SKU está repetido en el producto." });
      seen.add(sku);
    });
    p.images.forEach((img, i) => {
      if (img.variantSku && !p.variants.some((v) => v.sku === img.variantSku)) {
        ctx.addIssue({ code: "custom", path: ["images", i, "variantSku"], message: "Elige una variante que exista." });
      }
    });
  });

export type ProductInput = z.output<typeof productSchema>;
export type ProductFormValue = z.input<typeof productSchema>;

/** Errores por campo con ruta: { "variants.0.sku": "…", "name": "…" } */
export function productFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) fields[issue.path.join(".") || "_"] ??= issue.message;
  return fields;
}

import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, select: { slug: true } }),
    // Los productos de ejemplo no se publican en el sitemap.
    db.product.findMany({
      where: { isActive: true, isSample: false, category: { isActive: true }, variants: { some: { isActive: true } } },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const info = ["envios", "garantias", "devoluciones", "preguntas-frecuentes", "contacto", "terminos", "privacidad"];

  return [
    { url: siteConfig.url, changeFrequency: "daily", priority: 1 },
    ...info.map((slug) => ({ url: `${siteConfig.url}/${slug}`, changeFrequency: "monthly" as const, priority: 0.3 })),
    ...categories.map((c) => ({
      url: `${siteConfig.url}/categorias/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${siteConfig.url}/productos/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}

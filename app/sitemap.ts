import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

// Fase 1: solo existe el inicio. Las fases siguientes agregan categorías y productos activos.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteConfig.url, changeFrequency: "daily", priority: 1 }];
}

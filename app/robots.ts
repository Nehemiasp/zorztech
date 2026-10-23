import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/checkout", "/cuenta", "/carrito", "/api", "/pago-simulado"] },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}

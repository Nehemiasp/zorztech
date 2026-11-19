import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // La guía de envío (foto o PDF de hasta 4 MB) se sube con una acción del servidor; el límite por defecto es 1 MB.
  experimental: { serverActions: { bodySizeLimit: "4.5mb" } },
  images: {
    // Fotos del proyecto sin parámetros; las de categoría llevan ?v= para renovar la caché al reemplazarlas
    // (ver CATEGORY_IMAGES_VERSION en components/category-tile.tsx).
    localPatterns: [
      { pathname: "/**", search: "" },
      { pathname: "/img/categorias/**", search: "?v=2" },
    ],
    // Imágenes que se suben desde el panel a Vercel Blob.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

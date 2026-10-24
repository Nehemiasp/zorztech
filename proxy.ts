import { NextResponse, type NextRequest } from "next/server";

/**
 * Política de contenido (CSP) con nonce por petición. Next.js lee el nonce del encabezado de la petición
 * y se lo pone a sus propios scripts; no hay scripts en línea sin nonce. Las páginas ya se generan por
 * petición (leen la base de datos), así que el nonce no le quita nada al caché.
 */
export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";

  const csp = [
    "default-src 'self'",
    // En desarrollo React necesita eval para reconstruir pilas de llamadas; en producción no.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // Los atributos style de React no admiten nonce; los estilos de la tienda salen de hojas propias.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Solo documentos: sin recursos estáticos, imágenes optimizadas ni prefetch.
      source: "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|api/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

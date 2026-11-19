import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ScrollReveal } from "@/components/scroll-reveal";
import { siteConfig } from "@/lib/site";
import "./globals.css";

// Una sola familia, sobria y muy legible, con números tabulares: 400 y 500 en texto, 600 en títulos.
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", variable: "--font-inter" });

// El CSP lleva un nonce distinto en cada petición (proxy.ts), así que ninguna página puede prerenderse.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "ZorzTech | Celulares, laptops, audio y gaming en línea",
    template: "%s | ZorzTech",
  },
  description: siteConfig.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_GT",
    siteName: siteConfig.name,
    title: "ZorzTech | Celulares, laptops, audio y gaming en línea",
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-scroll-behavior: al cambiar de página, Next salta arriba sin el desplazamiento suave
    // (que se queda solo para los enlaces dentro de la misma página).
    <html lang="es" className={inter.variable} data-scroll-behavior="smooth">
      <body>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand-primary focus:px-4 focus:py-2 focus:text-brand-white"
        >
          Saltar al contenido
        </a>
        {children}
        <ScrollReveal />
      </body>
    </html>
  );
}

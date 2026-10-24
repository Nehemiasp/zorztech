import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Sora } from "next/font/google";
import { siteConfig } from "@/lib/site";
import "./globals.css";

// Máximo tres pesos en el proyecto: 400 y 500 en texto, 600 en títulos.
const sora = Sora({ subsets: ["latin"], weight: ["600"], display: "swap", variable: "--font-sora" });
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-plex",
});

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
    <html lang="es" className={`${sora.variable} ${plex.variable}`}>
      <body>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand-primary focus:px-4 focus:py-2 focus:text-brand-white"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}

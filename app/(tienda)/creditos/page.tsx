import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/info/info-page";

export const metadata: Metadata = {
  title: "Créditos de imágenes",
  description: "Autores y licencias de las fotos de las categorías de ZorzTech.",
  alternates: { canonical: "/creditos" },
};

const link = "text-brand-primary-strong underline underline-offset-2";

const credits: { category: string; title: string; author: string; license: string; licenseUrl?: string; source: string; sourceUrl: string }[] = [
  {
    category: "Almacenamiento",
    title: "USB Stick",
    author: "ccnull.de Bilddatenbank",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    source: "Flickr",
    sourceUrl: "https://www.flickr.com/photos/115225894@N07/54413288961",
  },
  {
    category: "Redes",
    title: "weißer Router auf weißen Hintergrund",
    author: "ccnull.de Bilddatenbank",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    source: "Flickr",
    sourceUrl: "https://www.flickr.com/photos/115225894@N07/53646461136",
  },
  {
    category: "Tablets",
    title: "Tablet Computer",
    author: "Birch Landing Home",
    license: "CC0 (dominio público)",
    source: "StockSnap",
    sourceUrl: "https://stocksnap.io/photo/tablet-computer-KCEVT4PCQ1",
  },
  {
    category: "Monitores",
    title: "Blank LCD Monitor Mockup On Isolated White Background",
    author: "personalgraphic.official",
    license: "CC0 (dominio público)",
    source: "Flickr",
    sourceUrl: "https://www.flickr.com/photos/198895458@N04/53097405789",
  },
  {
    category: "Componentes de PC",
    title: "CPU Processor",
    author: "Lenharth Systems",
    license: "CC0 (dominio público)",
    source: "StockSnap",
    sourceUrl: "https://stocksnap.io/photo/cpu-processor-SPQ6DQLFLF",
  },
  {
    category: "Smartwatches",
    title: "Smartwatch digital device technology",
    author: "Autor no indicado",
    license: "CC0 (dominio público)",
    source: "rawpixel",
    sourceUrl: "https://www.rawpixel.com/image/6042008/photo-image-cloud-light-public-domain",
  },
];

export default function CreditsPage() {
  return (
    <InfoPage title="Créditos de imágenes" intro="Algunas fotos de las categorías son de otras personas y se usan con su licencia. Aquí están sus autores.">
      <InfoSection title="Fotos de las categorías">
        <p>Las recortamos, ajustamos su tamaño y les quitamos el fondo para mostrarlas en la tienda.</p>
        <ul className="space-y-4">
          {credits.map((c) => (
            <li key={c.category}>
              <span className="font-medium text-text-on-light">{c.category}</span>
              <br />
              «{c.title}», de {c.author}. Licencia{" "}
              {c.licenseUrl ? (
                <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer" className={link}>
                  {c.license}
                  <span className="sr-only"> (se abre en otra pestaña)</span>
                </a>
              ) : (
                c.license
              )}
              . Fuente:{" "}
              <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className={link}>
                {c.source}
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
              .
            </li>
          ))}
        </ul>
      </InfoSection>
    </InfoPage>
  );
}

import { sweepIfDue } from "@/lib/orders/expiry";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Marker } from "@/components/marker";
import { ProductCard } from "@/components/product-card";
import { ProductView } from "@/components/product/product-view";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog/product";
import { jsonLd } from "@/lib/jsonld";
import { formatGTQ } from "@/lib/money";
import { fitTitle, pendingData, siteConfig, truncate } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variante?: string | string[] }>;
}

const FALLBACK_IMAGE = { url: "/img/placeholder/producto-1x1.svg", alt: "Espacio reservado para la foto del producto" };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado", robots: { index: false } };

  const cheapest = Math.min(...product.variants.map((v) => v.price));
  const base = `${product.name} desde ${formatGTQ(cheapest)}. ${product.description}`;
  // Descripciones cortas se completan con lo que siempre es cierto de la tienda, hasta ~150 caracteres.
  const description = truncate(base.length < 140 ? `${base} Envío a domicilio o recogida en tienda.` : base, 158);
  const path = `/productos/${product.slug}`;
  const photo = product.images.find((i) => !i.url.endsWith(".svg"));

  return {
    title: fitTitle(`${product.name}: precio y disponibilidad`, `${product.name}: precio y entrega`, product.name),
    description,
    alternates: { canonical: path },
    // Los productos de ejemplo no se indexan: son datos de prueba hasta que el dueño cargue su catálogo.
    robots: product.isSample ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: path,
      ...(photo ? { images: [{ url: photo.url, alt: photo.alt }] } : {}),
    },
  };
}

const schemaAvailability = (available: number) =>
  available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  await sweepIfDue();
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const sku = (await searchParams).variante;
  const related = await getRelatedProducts(product);

  const crumbs = [
    { name: "Inicio", href: "/" },
    ...(product.category.parent ? [{ name: product.category.parent.name, href: `/categorias/${product.category.parent.slug}` }] : []),
    { name: product.category.name, href: `/categorias/${product.category.slug}` },
    { name: product.name },
  ];

  const url = `${siteConfig.url}/productos/${product.slug}`;
  const offers = product.variants.map((v) => ({
    "@type": "Offer",
    sku: v.sku,
    name: v.name,
    url: product.variants.length > 1 ? `${url}?variante=${encodeURIComponent(v.sku)}` : url,
    price: (v.price / 100).toFixed(2),
    priceCurrency: "GTQ",
    itemCondition: "https://schema.org/NewCondition",
    availability: schemaAvailability(v.available),
  }));
  const prices = product.variants.map((v) => v.price / 100);
  const photos = product.images.filter((i) => !i.url.endsWith(".svg")).map((i) => `${siteConfig.url}${i.url}`);
  const structured = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.variants[0].sku,
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
    ...(photos.length ? { image: photos } : {}),
    offers:
      offers.length === 1
        ? offers[0]
        : {
            "@type": "AggregateOffer",
            priceCurrency: "GTQ",
            lowPrice: Math.min(...prices).toFixed(2),
            highPrice: Math.max(...prices).toFixed(2),
            offerCount: offers.length,
            offers,
          },
  };

  return (
    <div className="mx-auto max-w-page px-4 py-6 pb-24 md:px-6 md:py-8 lg:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-6">
        <ProductView
          variants={product.variants}
          images={product.images}
          fallbackImage={FALLBACK_IMAGE}
          productName={product.name}
          initialSku={typeof sku === "string" ? sku : null}
          titleSlot={
            <>
              {product.brand && <p className="text-text-muted">{product.brand.name}</p>}
              <h1 className="mt-1 text-2xl md:text-3xl">{product.name}</h1>
              {product.isSample && (
                <p className="mt-3 inline-block rounded-sm bg-surface-dark-alt px-2 py-0.5 text-sm text-text-on-dark">
                  Producto de ejemplo
                </p>
              )}
            </>
          }
          infoSlot={
            <dl className="mt-8 space-y-4 border-t border-border pt-6">
              <div>
                <dt className="font-medium">Entrega</dt>
                <dd className="text-text-muted">
                  A domicilio, con tarifa según tu departamento, o recogida en tienda. <Marker>{pendingData.deliveryTime}</Marker>{" "}
                  <Link href="/envios" className="text-brand-primary-strong underline underline-offset-2">
                    Ver envíos
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="font-medium">Garantía</dt>
                <dd className="text-text-muted">
                  <Marker>{pendingData.warranty}</Marker>{" "}
                  <Link href="/garantias" className="text-brand-primary-strong underline underline-offset-2">
                    Ver garantías
                  </Link>
                </dd>
              </div>
            </dl>
          }
        />
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <section aria-labelledby="descripcion-titulo">
          <h2 id="descripcion-titulo" className="text-xl">
            Descripción
          </h2>
          <p className="mt-3 max-w-[65ch] text-text-muted">{product.description}</p>
        </section>

        {product.specs.length > 0 && (
          <section aria-labelledby="especificaciones-titulo">
            <h2 id="especificaciones-titulo" className="text-xl">
              Especificaciones
            </h2>
            <table className="mt-3 w-full text-left">
              <tbody>
                {product.specs.map((s) => (
                  <tr key={s.clave} className="border-b border-border">
                    <th scope="row" className="w-2/5 py-3 pr-4 align-top font-medium">
                      {s.clave}
                    </th>
                    <td className="py-3 text-text-muted">{s.valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>

      {related.length > 0 && (
        <section aria-labelledby="relacionados-titulo" className="mt-14">
          <h2 id="relacionados-titulo" className="text-xl md:text-2xl">
            Productos relacionados
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
            {related.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

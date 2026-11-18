import { Fragment } from "react";
import { CategoryTile } from "@/components/category-tile";
import { Hero } from "@/components/home/hero";
import { CategoryPromo, promoCandidates, ShippingPromo, TransferPromo } from "@/components/home/promos";
import { Rail } from "@/components/home/rail";
import { RailItem } from "@/components/home/rail-item";
import { TrustStrip } from "@/components/home/trust-strip";
import { ProductCard } from "@/components/product-card";
import { getBestSellers, getCategoryRails, getFeaturedProducts, getNavCategories, getNewArrivals } from "@/lib/catalog/cards";
import { getHero, loadShipping, loadTransfer } from "@/lib/settings";
import { siteConfig } from "@/lib/site";

export const revalidate = 60;

function PromoPair({ pair }: { pair: Parameters<typeof CategoryPromo>[0]["rail"][] }) {
  return (
    <section aria-label="Promociones" className="mx-auto max-w-page px-4 py-4 md:px-6">
      <div className={`grid gap-4 ${pair.length > 1 ? "md:grid-cols-2" : ""}`}>
        {pair.map((rail, i) => (
          <CategoryPromo key={rail.category.id} rail={rail} tone={i === 0 ? "tint" : "light"} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [categories, featured, bestSellers, newArrivals, rails, hero, shipping, transfer] = await Promise.all([
    getNavCategories(),
    getFeaturedProducts(10),
    getBestSellers(10),
    getNewArrivals(10),
    getCategoryRails(10),
    getHero(),
    loadShipping(),
    loadTransfer(),
  ]);

  // Banners con datos reales: la categoría más surtida va junto al hero; las siguientes, en pares entre las filas.
  const [sidePromo, ...restPromos] = promoCandidates(rails);
  const promoPairs = [restPromos.slice(0, 2), restPromos.slice(2, 4)].filter((pair) => pair.length > 0);

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/brand/zorztech-simbolo.png`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <div className="mx-auto max-w-page px-4 pt-4 md:px-6 md:pt-6">
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Hero hero={hero} />
          <div className="hero-step grid gap-4 sm:grid-cols-2 lg:flex lg:flex-col" style={{ "--step": 2 } as React.CSSProperties}>
            {sidePromo && <CategoryPromo rail={sidePromo} size="side" />}
            <ShippingPromo shipping={shipping} />
          </div>
        </div>
      </div>

      <div className="hero-step" style={{ "--step": 3 } as React.CSSProperties}>
        <Rail id="categorias" anchor="categorias" title="Categorías">
          {categories.map((category) => (
            <RailItem key={category.id} size="category">
              <CategoryTile category={category} />
            </RailItem>
          ))}
        </Rail>
      </div>

      {featured.length > 0 && (
        <Rail id="destacados" title="Productos destacados">
          {featured.map((product) => (
            <RailItem key={product.id}>
              <ProductCard product={product} />
            </RailItem>
          ))}
        </Rail>
      )}

      {bestSellers.length > 0 && (
        <Rail id="vendidos" title="Lo más vendido">
          {bestSellers.map((product) => (
            <RailItem key={product.id}>
              <ProductCard product={product} />
            </RailItem>
          ))}
        </Rail>
      )}

      {newArrivals.length > 0 && (
        <Rail id="novedades" title="Novedades">
          {newArrivals.map((product) => (
            <RailItem key={product.id}>
              <ProductCard product={product} />
            </RailItem>
          ))}
        </Rail>
      )}

      <TrustStrip />

      {rails.map(({ category, products }, i) => (
        <Fragment key={category.id}>
          <Rail id={`fila-${category.slug}`} title={category.name} href={`/categorias/${category.slug}`}>
            {products.map((product) => (
              <RailItem key={product.id}>
                <ProductCard product={product} />
              </RailItem>
            ))}
          </Rail>
          {/* Cada dos filas, un par de banners; después de la cuarta, el aviso de transferencia */}
          {i % 2 === 1 && promoPairs[(i - 1) / 2] && <PromoPair pair={promoPairs[(i - 1) / 2]} />}
          {i === 3 && <TransferPromo transfer={transfer} />}
        </Fragment>
      ))}
      {rails.length < 4 && <TransferPromo transfer={transfer} />}
    </>
  );
}

import { CategoryTile } from "@/components/category-tile";
import { Hero } from "@/components/home/hero";
import { Rail } from "@/components/home/rail";
import { RailItem } from "@/components/home/rail-item";
import { TrustStrip } from "@/components/home/trust-strip";
import { ProductCard } from "@/components/product-card";
import { getBestSellers, getCategoryRails, getFeaturedProducts, getNavCategories, getNewArrivals } from "@/lib/catalog/cards";
import { getHero } from "@/lib/settings";
import { siteConfig } from "@/lib/site";

export const revalidate = 60;

export default async function HomePage() {
  const [categories, featured, bestSellers, newArrivals, rails, hero] = await Promise.all([
    getNavCategories(),
    getFeaturedProducts(10),
    getBestSellers(10),
    getNewArrivals(10),
    getCategoryRails(10),
    getHero(),
  ]);

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
      <Hero hero={hero} />

      <Rail id="categorias" anchor="categorias" title="Categorías">
        {categories.map((category) => (
          <RailItem key={category.id} size="category">
            <CategoryTile category={category} />
          </RailItem>
        ))}
      </Rail>

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

      <div className="my-6">
        <TrustStrip />
      </div>

      {rails.map(({ category, products }) => (
        <Rail key={category.id} id={`fila-${category.slug}`} title={category.name} href={`/categorias/${category.slug}`}>
          {products.map((product) => (
            <RailItem key={product.id}>
              <ProductCard product={product} />
            </RailItem>
          ))}
        </Rail>
      ))}
    </>
  );
}

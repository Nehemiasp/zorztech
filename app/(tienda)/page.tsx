import { CategoryTile } from "@/components/category-tile";
import { Hero } from "@/components/home/hero";
import { TrustStrip } from "@/components/home/trust-strip";
import { ProductCard } from "@/components/product-card";
import { getBestSellers, getFeaturedProducts, getNavCategories } from "@/lib/catalog/cards";
import { getHero } from "@/lib/settings";
import { siteConfig } from "@/lib/site";

export const revalidate = 60;

export default async function HomePage() {
  const [categories, featured, bestSellers, hero] = await Promise.all([
    getNavCategories(),
    getFeaturedProducts(8),
    getBestSellers(4),
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

      <section id="categorias" aria-labelledby="categorias-titulo" className="scroll-mt-4 bg-surface-light">
        <div className="mx-auto max-w-page px-4 py-14 md:px-6 md:py-20">
          <h2 id="categorias-titulo" className="text-xl md:text-2xl">
            Categorías
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-6">
            {categories.map((category) => (
              <li key={category.id}>
                <CategoryTile category={category} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="destacados-titulo" className="bg-surface-light">
          <div className="mx-auto max-w-page px-4 pb-14 md:px-6 md:pb-20">
            <h2 id="destacados-titulo" className="text-xl md:text-2xl">
              Productos destacados
            </h2>
            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
              {featured.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <TrustStrip />

      {bestSellers.length > 0 && (
        <section aria-labelledby="vendidos-titulo" className="bg-surface-light">
          <div className="mx-auto max-w-page px-4 py-14 md:px-6 md:py-20">
            <h2 id="vendidos-titulo" className="text-xl md:text-2xl">
              Lo más vendido
            </h2>
            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
              {bestSellers.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}

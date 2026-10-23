import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ListingView } from "@/components/catalog/listing-view";
import { getFacets, getSearchCategoryFacets, listProducts } from "@/lib/catalog/listing";
import { filtersToQuery, parseFilters, type RawSearchParams } from "@/lib/catalog/params";

interface Props {
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = parseFilters(await searchParams);
  return {
    title: q ? `Resultados para «${q}»` : "Buscar productos",
    description: "Busca celulares, laptops, audio, gaming y hogar inteligente en ZorzTech.",
    alternates: { canonical: "/buscar" },
    // Los resultados de búsqueda no se indexan.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  const scope = { q: filters.q };
  const [result, facets, categories] = await Promise.all([
    listProducts(scope, filters),
    getFacets(scope),
    getSearchCategoryFacets(scope),
  ]);

  if (result.total > 0 && filters.pagina > result.pageCount) {
    permanentRedirect(`/buscar${filtersToQuery({ ...filters, pagina: result.pageCount })}`);
  }

  return (
    <div className="mx-auto max-w-page px-4 py-6 md:px-6 md:py-8">
      <Breadcrumbs items={[{ name: "Inicio", href: "/" }, { name: "Búsqueda" }]} />
      <h1 className="mt-4 text-2xl md:text-3xl">{filters.q ? `Resultados para «${filters.q}»` : "Todos los productos"}</h1>
      <ListingView
        basePath="/buscar"
        filters={filters}
        result={result}
        facets={facets}
        categories={categories}
        categoriesLabel="Categoría"
        emptyText="Estamos preparando el catálogo."
      />
    </div>
  );
}

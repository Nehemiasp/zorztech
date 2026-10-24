import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ListingView } from "@/components/catalog/listing-view";
import {
  categoryScope,
  getCategoryBySlug,
  getFacets,
  getScopeSummary,
  listProducts,
} from "@/lib/catalog/listing";
import { filtersToQuery, hasActiveFilters, parseFilters, type RawSearchParams } from "@/lib/catalog/params";
import { formatGTQ } from "@/lib/money";
import { fitTitle } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Categoría no encontrada", robots: { index: false } };

  const filters = parseFilters(await searchParams);
  const { total, minPrice } = await getScopeSummary(categoryScope(category).categoryIds!);
  const path = `/categorias/${category.slug}`;
  const from = minPrice !== null ? ` desde ${formatGTQ(minPrice)}` : "";
  const description =
    total > 0
      ? `Compra ${category.name.toLowerCase()} en ZorzTech: ${total} ${total === 1 ? "producto" : "productos"}${from}. Envío a domicilio o recogida en tienda, pago en línea en quetzales y seguimiento de tu pedido.`
      : `Productos de ${category.name.toLowerCase()} en ZorzTech. Muy pronto más opciones con envío a domicilio o recogida en tienda.`;

  // Las combinaciones de filtros y orden no se indexan; la página de la categoría sí.
  const variant = hasActiveFilters(filters) || filters.orden !== "relevancia";
  return {
    title: fitTitle(
      `${category.name} en línea: precios, disponibilidad y entrega`,
      `${category.name} en línea: precios y entrega`,
    ),
    description,
    alternates: { canonical: filters.pagina > 1 ? `${path}?pagina=${filters.pagina}` : path },
    robots: variant ? { index: false, follow: true } : undefined,
    openGraph: { title: `${category.name} en ZorzTech`, description, url: path },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const filters = parseFilters(await searchParams);
  const basePath = `/categorias/${category.slug}`;
  const scope = categoryScope(category);
  const [result, facets] = await Promise.all([listProducts(scope, filters), getFacets(scope)]);

  // Una página fuera de rango lleva a la última que sí tiene productos.
  if (result.total > 0 && filters.pagina > result.pageCount) {
    permanentRedirect(`${basePath}${filtersToQuery({ ...filters, pagina: result.pageCount })}`);
  }

  const crumbs = [
    { name: "Inicio", href: "/" },
    ...(category.parent ? [{ name: category.parent.name, href: `/categorias/${category.parent.slug}` }] : []),
    { name: category.name },
  ];

  return (
    <div className="mx-auto max-w-page px-4 py-6 md:px-6 md:py-8">
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-4 text-2xl md:text-3xl">{category.name}</h1>
      <ListingView
        basePath={basePath}
        filters={filters}
        result={result}
        facets={facets}
        categories={category.children.map((c) => ({ slug: c.slug, name: c.name }))}
        categoriesLabel="Subcategoría"
        emptyText="Estamos preparando esta categoría. Mientras tanto, mira las demás."
      />
    </div>
  );
}

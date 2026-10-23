import Link from "next/link";
import { X } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { LinkButton } from "@/components/ui/button";
import type { Facets, ListingResult } from "@/lib/catalog/listing";
import {
  filtersToQuery,
  hasActiveFilters,
  sortOptions,
  type ListingFilters,
} from "@/lib/catalog/params";
import { FilterForm, type FilterOption } from "./filter-form";
import { FiltersSheet } from "./filters-sheet";
import { Pagination } from "./pagination";
import { SortSelect } from "./sort-select";

interface Props {
  basePath: string;
  filters: ListingFilters;
  result: ListingResult;
  facets: Facets;
  categories: FilterOption[];
  categoriesLabel: string;
  /** Texto para el estado vacío cuando no hay filtros ni búsqueda. */
  emptyText: string;
}

interface Chip {
  label: string;
  removeHref: string;
}

function activeChips(
  filters: ListingFilters,
  facets: Facets,
  categories: FilterOption[],
  href: (f: Partial<ListingFilters>) => string,
): Chip[] {
  const chips: Chip[] = [];
  const without = (patch: Partial<ListingFilters>) => href({ ...filters, pagina: 1, ...patch });

  for (const slug of filters.categoria) {
    const name = categories.find((c) => c.slug === slug)?.name ?? slug;
    chips.push({ label: name, removeHref: without({ categoria: filters.categoria.filter((s) => s !== slug) }) });
  }
  for (const slug of filters.marca) {
    const name = facets.marcas.find((m) => m.slug === slug)?.name ?? slug;
    chips.push({ label: name, removeHref: without({ marca: filters.marca.filter((s) => s !== slug) }) });
  }
  if (filters.desde !== null) chips.push({ label: `Desde Q ${filters.desde}`, removeHref: without({ desde: null }) });
  if (filters.hasta !== null) chips.push({ label: `Hasta Q ${filters.hasta}`, removeHref: without({ hasta: null }) });
  if (filters.disponibles) chips.push({ label: "Solo disponibles", removeHref: without({ disponibles: false }) });
  for (const [key, values] of Object.entries(filters.atributos)) {
    const label = facets.atributos.find((a) => a.key === key)?.label ?? key;
    for (const value of values) {
      const rest = values.filter((v) => v !== value);
      const atributos = { ...filters.atributos };
      if (rest.length) atributos[key] = rest;
      else delete atributos[key];
      chips.push({ label: `${label}: ${value}`, removeHref: without({ atributos }) });
    }
  }
  return chips;
}

export function ListingView({ basePath, filters, result, facets, categories, categoriesLabel, emptyText }: Props) {
  const href = (f: Partial<ListingFilters>) => `${basePath}${filtersToQuery(f)}`;
  const clearHref = href({ q: filters.q, orden: filters.orden });
  const chips = activeChips(filters, facets, categories, href);
  const filtersActive = hasActiveFilters(filters);

  const form = (
    <FilterForm
      basePath={basePath}
      filters={filters}
      facets={facets}
      categories={categories}
      categoriesLabel={categoriesLabel}
      clearHref={clearHref}
    />
  );

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-10">
      <aside aria-label="Filtros" className="hidden lg:block">
        <h2 className="mb-4 text-lg">Filtros</h2>
        {form}
      </aside>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-text-muted">
            {result.total === 1 ? "1 producto" : `${result.total} productos`}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <FiltersSheet activeCount={chips.length}>{form}</FiltersSheet>
            <SortSelect
              value={filters.orden}
              options={sortOptions.map((o) => ({
                value: o.value,
                label: o.label,
                href: href({ ...filters, orden: o.value, pagina: 1 }),
              }))}
            />
          </div>
        </div>

        {chips.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Filtros aplicados">
            {chips.map((chip) => (
              <li key={chip.label}>
                <Link
                  href={chip.removeHref}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong px-3 text-sm hover:bg-surface-light-alt"
                >
                  {chip.label}
                  <X aria-hidden size={16} strokeWidth={1.75} />
                  <span className="sr-only">Quitar filtro</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href={clearHref} className="inline-flex min-h-11 items-center px-2 text-brand-primary-strong underline underline-offset-2">
                Limpiar filtros
              </Link>
            </li>
          </ul>
        )}

        <h2 className="sr-only">Productos</h2>
        {result.items.length > 0 ? (
          <>
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6">
              {result.items.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
            <Pagination page={result.page} pageCount={result.pageCount} hrefFor={(page) => href({ ...filters, pagina: page })} />
          </>
        ) : (
          <div className="mt-8 max-w-xl rounded-lg bg-surface-light-alt p-6 md:p-8">
            <p className="text-xl font-display">
              {filtersActive ? "Ningún producto cumple esos filtros" : filters.q ? `No encontramos «${filters.q}»` : "Todavía no hay productos aquí"}
            </p>
            <p className="mt-3 text-text-muted">
              {filtersActive
                ? "Quita alguno para ver más resultados o empieza de nuevo."
                : filters.q
                  ? "Revisa que esté bien escrito, prueba con una palabra más corta o explora las categorías."
                  : emptyText}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {filtersActive && <LinkButton href={clearHref}>Limpiar filtros</LinkButton>}
              <LinkButton href="/#categorias" variant={filtersActive ? "secondary-light" : "primary"}>
                Ver categorías
              </LinkButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

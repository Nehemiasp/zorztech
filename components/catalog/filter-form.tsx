import Link from "next/link";
import type { Facets } from "@/lib/catalog/listing";
import { attributeParam, hasActiveFilters, type ListingFilters } from "@/lib/catalog/params";
import { buttonStyles } from "@/components/ui/button";

export interface FilterOption {
  slug: string;
  name: string;
}

interface Props {
  basePath: string;
  filters: ListingFilters;
  facets: Facets;
  /** Subcategorías (en una categoría) o categorías (en una búsqueda). */
  categories: FilterOption[];
  categoriesLabel: string;
  clearHref: string;
}

const optionLabel = "flex min-h-11 cursor-pointer items-center gap-3 rounded-sm lg:min-h-9";
const checkbox = "size-5 shrink-0 accent-brand-primary";
const legend = "mb-1 font-medium";
const field =
  "min-h-11 w-full rounded-sm border border-border-strong bg-surface-light px-3 text-base text-text-on-light placeholder:text-text-muted";

/**
 * Formulario GET: funciona sin JavaScript y deja los filtros en la URL.
 * Las etiquetas envuelven a cada campo, así el mismo formulario puede aparecer dos veces
 * (panel lateral y hoja móvil) sin repetir identificadores.
 */
export function FilterForm({ basePath, filters, facets, categories, categoriesLabel, clearHref }: Props) {
  return (
    <form action={basePath} method="get" className="space-y-6">
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
      {filters.orden !== "relevancia" && <input type="hidden" name="orden" value={filters.orden} />}

      {categories.length > 0 && (
        <fieldset>
          <legend className={legend}>{categoriesLabel}</legend>
          {categories.map((c) => (
            <label key={c.slug} className={optionLabel}>
              <input type="checkbox" name="categoria" value={c.slug} defaultChecked={filters.categoria.includes(c.slug)} className={checkbox} />
              {c.name}
            </label>
          ))}
        </fieldset>
      )}

      {facets.marcas.length > 0 && (
        <fieldset>
          <legend className={legend}>Marca</legend>
          {facets.marcas.map((m) => (
            <label key={m.slug} className={optionLabel}>
              <input type="checkbox" name="marca" value={m.slug} defaultChecked={filters.marca.includes(m.slug)} className={checkbox} />
              {m.name}
            </label>
          ))}
        </fieldset>
      )}

      <fieldset>
        <legend className={legend}>Precio (Q)</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-text-muted">
            Desde
            <input type="number" name="desde" min={0} inputMode="numeric" defaultValue={filters.desde ?? ""} className={`${field} mt-1`} />
          </label>
          <label className="block text-sm text-text-muted">
            Hasta
            <input type="number" name="hasta" min={0} inputMode="numeric" defaultValue={filters.hasta ?? ""} className={`${field} mt-1`} />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className={legend}>Disponibilidad</legend>
        <label className={optionLabel}>
          <input type="checkbox" name="disponibles" value="1" defaultChecked={filters.disponibles} className={checkbox} />
          Solo productos disponibles
        </label>
      </fieldset>

      {facets.atributos.map((attr) => (
        <fieldset key={attr.key}>
          <legend className={legend}>{attr.label}</legend>
          {attr.values.map((value) => (
            <label key={value} className={optionLabel}>
              <input
                type="checkbox"
                name={attributeParam(attr.key)}
                value={value}
                defaultChecked={filters.atributos[attr.key]?.includes(value) ?? false}
                className={checkbox}
              />
              {value}
            </label>
          ))}
        </fieldset>
      ))}

      {/* En la hoja móvil la acción queda fija abajo: la lista de filtros puede ser larga. */}
      <div className="flex flex-wrap items-center gap-3 max-lg:sticky max-lg:bottom-0 max-lg:-mx-4 max-lg:border-t max-lg:border-border max-lg:bg-surface-light max-lg:px-4 max-lg:py-3">
        <button type="submit" className={buttonStyles("primary")}>
          Aplicar filtros
        </button>
        {hasActiveFilters(filters) && (
          <Link href={clearHref} className="inline-flex min-h-11 items-center text-brand-primary-strong underline underline-offset-2">
            Limpiar filtros
          </Link>
        )}
      </div>
    </form>
  );
}

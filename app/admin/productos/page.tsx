import type { Metadata } from "next";
import Link from "next/link";
import { EmptyRow, PageHeader, table, ScrollRegion } from "@/components/admin/ui";
import { Pagination } from "@/components/catalog/pagination";
import { buttonStyles } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { getFormOptions, listAdminProducts, parseProductFilters, type ProductFilters } from "@/lib/admin/products";
import { toggleProductAction } from "./actions";
import { requireAdmin } from "@/lib/auth/guards";
import { formatGTQ } from "@/lib/money";

export const metadata: Metadata = { title: "Productos" };

const query = (f: Partial<ProductFilters>) => {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.categoria) p.set("categoria", f.categoria);
  if (f.estado) p.set("estado", f.estado);
  if (f.stockBajo) p.set("stockBajo", "1");
  if (f.ejemplo) p.set("ejemplo", "1");
  if (f.pagina && f.pagina > 1) p.set("pagina", String(f.pagina));
  const s = p.toString();
  return s ? `?${s}` : "";
};

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const filters = parseProductFilters(await searchParams);
  const [{ rows, total, pageCount }, { categories }] = await Promise.all([listAdminProducts(filters), getFormOptions()]);
  const active = Boolean(filters.q || filters.categoria || filters.estado || filters.stockBajo || filters.ejemplo);

  return (
    <>
      <PageHeader title="Productos">
        <Link href="/admin/productos/nuevo" className={buttonStyles("primary")}>
          Nuevo producto
        </Link>
      </PageHeader>

      <form method="get" className="mb-6 grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_14rem_10rem_auto_auto]">
        <TextField label="Buscar por nombre o SKU" name="q" type="search" defaultValue={filters.q} />
        <SelectField label="Categoría" name="categoria" placeholder="Todas" options={categories.map((c) => ({ value: c.id, label: c.name }))} defaultValue={filters.categoria} />
        <SelectField
          label="Estado"
          name="estado"
          placeholder="Todos"
          options={[
            { value: "activos", label: "Activos" },
            { value: "inactivos", label: "Inactivos" },
          ]}
          defaultValue={filters.estado}
        />
        <div className="space-y-0.5">
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" name="stockBajo" value="1" defaultChecked={filters.stockBajo} className="size-5 accent-brand-primary" />
            Stock bajo
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" name="ejemplo" value="1" defaultChecked={filters.ejemplo} className="size-5 accent-brand-primary" />
            De ejemplo
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={buttonStyles("primary")}>
            Filtrar
          </button>
          {active && (
            <Link href="/admin/productos" className={buttonStyles("secondary-light")}>
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <p aria-live="polite" className="mb-3 text-text-muted">
        {total === 1 ? "1 producto" : `${total} productos`}
      </p>
      <ScrollRegion label="Productos">
        <table className={table.table}>
          <caption className="sr-only">Productos</caption>
          <thead className={table.head}>
            <tr>
              <th scope="col" className={table.th}>Producto</th>
              <th scope="col" className={table.th}>Categoría</th>
              <th scope="col" className={`${table.th} text-right`}>Desde</th>
              <th scope="col" className={`${table.th} text-right`}>Disponibles</th>
              <th scope="col" className={table.th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={5}>{active ? "Ningún producto cumple esos filtros." : "Todavía no hay productos."}</EmptyRow>}
            {rows.map((p) => (
              <tr key={p.id} className={table.row}>
                <th scope="row" className={`${table.td} font-medium`}>
                  <Link href={`/admin/productos/${p.id}`} className="underline underline-offset-2">
                    {p.name}
                  </Link>
                  <span className="block text-sm font-normal text-text-muted">
                    {p.variantCount} {p.variantCount === 1 ? "variante" : "variantes"}
                    {p.brand ? ` · ${p.brand.name}` : ""}
                  </span>
                  {p.isSample && <span className="mt-1 inline-block rounded-sm bg-surface-dark-alt px-2 py-0.5 text-sm font-normal text-text-on-dark">Ejemplo</span>}
                </th>
                <td className={table.td}>{p.category.name}</td>
                <td className={`${table.td} text-right`}>{p.minPrice !== null ? formatGTQ(p.minPrice) : "—"}</td>
                <td className={`${table.td} text-right`}>
                  <span className={p.available === 0 ? "font-medium text-state-error" : p.lowStock ? "font-medium text-state-warning" : ""}>{p.available}</span>
                  {p.lowStock && <span className="block text-sm text-text-muted">{p.available === 0 ? "Agotado" : "Stock bajo"}</span>}
                </td>
                <td className={table.td}>
                  <form action={toggleProductAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="activar" value={p.isActive ? "0" : "1"} />
                    <span className={p.isActive ? "text-state-success" : "text-text-muted"}>{p.isActive ? "Activo" : "Inactivo"}</span>
                    {p.isFeatured && <span className="text-sm text-text-muted">· Destacado</span>}
                    <button type="submit" className="inline-flex min-h-11 items-center text-brand-primary-strong underline underline-offset-2">
                      {p.isActive ? "Desactivar" : "Activar"}
                      <span className="sr-only"> {p.name}</span>
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
      <Pagination page={filters.pagina} pageCount={pageCount} hrefFor={(page) => `/admin/productos${query({ ...filters, pagina: page })}`} />
    </>
  );
}

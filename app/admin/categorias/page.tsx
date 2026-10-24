import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { PageHeader, table, ScrollRegion } from "@/components/admin/ui";
import { buttonStyles } from "@/components/ui/button";
import { listCategoryTree } from "@/lib/admin/categories";
import { requireAdmin } from "@/lib/auth/guards";
import { moveCategoryAction, toggleCategoryAction } from "./actions";

export const metadata: Metadata = { title: "Categorías" };

const arrow = "inline-flex size-11 items-center justify-center rounded-md hover:bg-surface-light-alt disabled:opacity-40";

function Row({ c, first, last, level }: { c: Awaited<ReturnType<typeof listCategoryTree>>[number]; first: boolean; last: boolean; level: 0 | 1 }) {
  return (
    <tr className={table.row}>
      <th scope="row" className={`${table.td} font-medium`}>
        <span className={level ? "ml-6" : ""}>
          <Link href={`/admin/categorias/${c.id}`} className="underline underline-offset-2">
            {c.name}
          </Link>
        </span>
        <span className={`block text-sm font-normal text-text-muted ${level ? "ml-6" : ""}`}>
          /categorias/{c.slug} · {c._count.products} {c._count.products === 1 ? "producto" : "productos"}
        </span>
      </th>
      <td className={table.td}>
        <form action={toggleCategoryAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="activar" value={c.isActive ? "0" : "1"} />
          <span className={c.isActive ? "text-state-success" : "text-text-muted"}>{c.isActive ? "Activa" : "Inactiva"}</span>
          <button type="submit" className="inline-flex min-h-11 items-center text-brand-primary-strong underline underline-offset-2">
            {c.isActive ? "Desactivar" : "Activar"}
            <span className="sr-only"> {c.name}</span>
          </button>
        </form>
      </td>
      <td className={table.td}>
        <div className="flex">
          <form action={moveCategoryAction}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="dir" value="up" />
            <button type="submit" disabled={first} className={arrow}>
              <ArrowUp aria-hidden size={18} strokeWidth={1.75} />
              <span className="sr-only">Subir {c.name}</span>
            </button>
          </form>
          <form action={moveCategoryAction}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="dir" value="down" />
            <button type="submit" disabled={last} className={arrow}>
              <ArrowDown aria-hidden size={18} strokeWidth={1.75} />
              <span className="sr-only">Bajar {c.name}</span>
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ creada?: string; borrada?: string }> }) {
  await requireAdmin();
  const [tree, { creada, borrada }] = await Promise.all([listCategoryTree(), searchParams]);

  return (
    <>
      <PageHeader title="Categorías">
        <Link href="/admin/categorias/nueva" className={buttonStyles("primary")}>
          Nueva categoría
        </Link>
      </PageHeader>
      {borrada && (
        <p role="status" className="mb-4 rounded-md border border-state-success p-3 text-state-success">
          Borramos la categoría.
        </p>
      )}
      {creada && (
        <p role="status" className="mb-4 rounded-md border border-state-success p-3 text-state-success">
          Creamos la categoría.
        </p>
      )}
      <ScrollRegion label="Categorías y subcategorías, en el orden en que se ven en la tienda">
        <table className={table.table}>
          <caption className="sr-only">Categorías y subcategorías, en el orden en que se ven en la tienda</caption>
          <thead className={table.head}>
            <tr>
              <th scope="col" className={table.th}>Categoría</th>
              <th scope="col" className={table.th}>Estado</th>
              <th scope="col" className={table.th}>Orden</th>
            </tr>
          </thead>
          <tbody>
            {tree.flatMap((root, i) => [
              <Row key={root.id} c={root} first={i === 0} last={i === tree.length - 1} level={0} />,
              ...root.children.map((child, j) => <Row key={child.id} c={{ ...child, children: [] }} first={j === 0} last={j === root.children.length - 1} level={1} />),
            ])}
          </tbody>
        </table>
      </ScrollRegion>
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryForm, DeleteCategoryForm } from "@/components/admin/category-form";
import { PageHeader, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Editar categoría" };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const category = await db.category.findUnique({ where: { id: (await params).id } });
  if (!category) notFound();
  const parents = await db.category.findMany({ where: { parentId: null }, orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } });
  return (
    <div className="space-y-10">
      <div>
        <PageHeader title={category.name} />
        <CategoryForm category={category} parents={parents} />
      </div>
      <Panel title="Borrar categoría" className="max-w-xl">
        <DeleteCategoryForm id={category.id} name={category.name} />
      </Panel>
    </div>
  );
}

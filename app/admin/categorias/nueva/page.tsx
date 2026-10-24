import type { Metadata } from "next";
import { CategoryForm } from "@/components/admin/category-form";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Nueva categoría" };

export default async function NewCategoryPage() {
  await requireAdmin();
  const parents = await db.category.findMany({ where: { parentId: null }, orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } });
  return (
    <>
      <PageHeader title="Nueva categoría" />
      <CategoryForm parents={parents} />
    </>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { deleteCategory, categorySchema, moveCategory, saveCategory } from "@/lib/admin/categories";
import { adminUser, noPermission } from "@/lib/admin/guard";
import type { FormState } from "@/lib/auth/actions";
import { db } from "@/lib/db";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

export async function saveCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await adminUser())) return noPermission;
  const parsed = categorySchema.safeParse({
    id: text(formData, "id") || undefined,
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    parentId: text(formData, "parentId") || null,
    image: text(formData, "image"),
    isActive: formData.get("isActive") === "on",
  });
  const values = { name: text(formData, "name"), slug: text(formData, "slug"), parentId: text(formData, "parentId"), image: text(formData, "image") };
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { fields, values };
  }
  const result = await saveCategory(parsed.data);
  if (!result.ok) return { error: result.message, fields: result.fields, values };
  revalidatePath("/", "layout");
  if (!parsed.data.id) redirect("/admin/categorias?creada=1");
  return { success: "Guardamos la categoría.", values };
}

export async function moveCategoryAction(formData: FormData): Promise<void> {
  if (!(await adminUser())) return;
  const parsed = z.object({ id: z.string().min(1), dir: z.enum(["up", "down"]) }).safeParse({ id: text(formData, "id"), dir: text(formData, "dir") });
  if (!parsed.success) return;
  await moveCategory(parsed.data.id, parsed.data.dir);
  revalidatePath("/", "layout");
}

export async function toggleCategoryAction(formData: FormData): Promise<void> {
  if (!(await adminUser())) return;
  const id = text(formData, "id");
  if (!id) return;
  await db.category.update({ where: { id }, data: { isActive: formData.get("activar") === "1" } });
  revalidatePath("/", "layout");
}

export async function deleteCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await adminUser())) return noPermission;
  const result = await deleteCategory(text(formData, "id"));
  revalidatePath("/", "layout");
  if (result.ok) redirect("/admin/categorias?borrada=1");
  return { error: result.message };
}

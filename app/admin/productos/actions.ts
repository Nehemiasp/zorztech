"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminUser, noPermission } from "@/lib/admin/guard";
import { productFieldErrors, productSchema } from "@/lib/admin/product-schema";
import { saveProduct, setProductActive } from "@/lib/admin/products";
import type { FormState } from "@/lib/auth/actions";

export interface ProductFormState extends FormState {
  /** Para volver a pintar el formulario si hubo errores. */
  fields?: Record<string, string>;
}

/** El formulario del producto viaja como JSON en un campo oculto: tiene listas anidadas (variantes, imágenes). */
export async function saveProductAction(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  if (!(await adminUser())) return noPermission;

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "No pudimos leer el formulario. Recarga la página e inténtalo de nuevo." };
  }
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Revisa los campos marcados.", fields: productFieldErrors(parsed.error) };
  }

  const result = await saveProduct(parsed.data);
  if (!result.ok) return { error: result.message ?? "Revisa los campos marcados.", fields: result.fields };

  // La tienda se genera con datos del catálogo: se refresca el inicio y el resto responde en cada visita.
  revalidatePath("/", "layout");
  if (!parsed.data.id) redirect(`/admin/productos/${result.id}?creado=1`);
  return { success: ["Guardamos el producto.", ...result.notices].join(" ") };
}

export async function toggleProductAction(formData: FormData): Promise<void> {
  if (!(await adminUser())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await setProductActive(id, formData.get("activar") === "1");
  revalidatePath("/", "layout");
}

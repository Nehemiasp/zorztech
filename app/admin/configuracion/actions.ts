"use server";

import { revalidatePath } from "next/cache";
import { removePickup, pickupSchema, ratesFormSchema, resetHeroBanner, saveHeroBanner, savePickup, saveRates } from "@/lib/admin/config";
import { adminUser, noPermission } from "@/lib/admin/guard";
import type { FormState } from "@/lib/auth/actions";
import { bannerSchema, contactSchema, inventorySchema, saveSetting } from "@/lib/settings";
import { departamentos } from "@/lib/geo/departamentos";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

function fieldsOf(error: { issues: { path: PropertyKey[]; message: string }[] }): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) fields[issue.path.map(String).join(".")] ??= issue.message;
  return fields;
}

const refresh = () => revalidatePath("/", "layout");

export async function saveContactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await adminUser())) return noPermission;
  const values = Object.fromEntries(["phone", "email", "hours", "socials", "paymentMethods"].map((k) => [k, text(formData, k)]));
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) return { fields: fieldsOf(parsed.error), values };
  await saveSetting("contacto", parsed.data);
  refresh();
  return { success: "Guardamos los datos de contacto. Ya se ven en el pie de la tienda.", values };
}

export async function saveInventoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await adminUser())) return noPermission;
  const values = { lowStockDefault: text(formData, "lowStockDefault") };
  const parsed = inventorySchema.safeParse(values);
  if (!parsed.success) return { fields: fieldsOf(parsed.error), values };
  await saveSetting("inventario", parsed.data);
  return { success: "Guardamos el mínimo de stock. Se usa en las variantes nuevas.", values };
}

export async function saveBannerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await adminUser())) return noPermission;
  const values = Object.fromEntries(["title", "body", "ctaLabel", "ctaHref", "imageUrl", "imageAlt"].map((k) => [k, text(formData, k)]));
  const parsed = bannerSchema.safeParse({ ...values, isActive: formData.get("isActive") === "on" });
  if (!parsed.success) return { fields: fieldsOf(parsed.error), values };
  if (parsed.data.imageUrl && !/^(\/api\/uploads\/|\/img\/placeholder\/|https:\/\/[\w-]+\.public\.blob\.vercel-storage\.com\/)/.test(parsed.data.imageUrl)) {
    return { fields: { imageUrl: "La imagen no es válida. Súbela desde aquí." }, values };
  }
  await saveHeroBanner(parsed.data);
  refresh();
  return { success: "Guardamos el banner. Ya se ve en el inicio.", values };
}

export async function resetBannerAction(): Promise<FormState> {
  if (!(await adminUser())) return noPermission;
  await resetHeroBanner();
  refresh();
  return { success: "Volvimos al banner por defecto." };
}

export async function saveRatesAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await adminUser())) return noPermission;
  const raw: Record<string, { price: string; days: string }> = {};
  for (const d of departamentos) raw[d] = { price: text(formData, `price:${d}`), days: text(formData, `days:${d}`) };
  const parsed = ratesFormSchema.safeParse(raw);
  if (!parsed.success) return { error: "No pudimos leer las tarifas." };
  const result = await saveRates(parsed.data);
  if (!result.ok) return { error: "Revisa las tarifas marcadas.", fields: result.fields };
  refresh();
  return { success: `Guardamos ${result.saved} tarifas.${result.removed > 0 ? ` En ${result.removed} departamentos no se ofrece envío a domicilio: solo recogida.` : ""}` };
}

export async function savePickupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await adminUser())) return noPermission;
  const values = Object.fromEntries(["name", "address", "hours"].map((k) => [k, text(formData, k)]));
  const parsed = pickupSchema.safeParse({ ...values, id: text(formData, "id") || undefined, isActive: formData.get("isActive") === "on" });
  if (!parsed.success) return { fields: fieldsOf(parsed.error), values };
  const result = await savePickup(parsed.data);
  if (!result.ok) return { error: result.message, values };
  refresh();
  revalidatePath("/admin/configuracion");
  return { success: parsed.data.id ? "Guardamos la tienda." : "Agregamos la tienda.", values: parsed.data.id ? values : {} };
}

export async function removePickupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await adminUser())) return noPermission;
  const result = await removePickup(text(formData, "id"));
  refresh();
  revalidatePath("/admin/configuracion");
  return result.ok ? { success: result.message } : { error: result.message };
}

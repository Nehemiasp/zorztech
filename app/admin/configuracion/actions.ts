"use server";

import { revalidatePath } from "next/cache";
import { removePickup, pickupSchema, resetHeroBanner, saveHeroBanner, savePickup } from "@/lib/admin/config";
import { adminUser, noPermission } from "@/lib/admin/guard";
import type { FormState } from "@/lib/auth/actions";
import { parseGTQ } from "@/lib/money";
import { bannerSchema, contactSchema, inventorySchema, saveSetting, shippingSchema } from "@/lib/settings";
import { transferSchema } from "@/lib/transfer";

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

export async function saveShippingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await adminUser())) return noPermission;
  const values = { flatRate: text(formData, "flatRate"), freeFrom: text(formData, "freeFrom"), deliveryTime: text(formData, "deliveryTime") };
  const fields: Record<string, string> = {};
  const flatRate = parseGTQ(values.flatRate);
  if (flatRate === null) fields.flatRate = "Escribe el costo en quetzales, por ejemplo 55.00 (0 si el envío siempre es gratis).";
  // En blanco o 0: no se ofrece envío gratis por monto.
  const freeFrom = values.freeFrom.trim() === "" ? 0 : parseGTQ(values.freeFrom);
  if (freeFrom === null) fields.freeFrom = "Escribe el monto en quetzales, por ejemplo 400.00, o déjalo en blanco.";
  if (Object.keys(fields).length > 0 || flatRate === null || freeFrom === null) return { fields, values };
  const parsed = shippingSchema.safeParse({ flatRate, freeFrom, deliveryTime: values.deliveryTime });
  if (!parsed.success) return { fields: fieldsOf(parsed.error), values };
  await saveSetting("envio", parsed.data);
  refresh();
  return { success: "Guardamos el envío. Ya se aplica en el carrito y en el pago.", values };
}

export async function saveTransferAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await adminUser())) return noPermission;
  const values = Object.fromEntries(["bankName", "accountName", "accountNumber", "accountType", "instructions", "holdHours"].map((k) => [k, text(formData, k)]));
  const hold = values.holdHours.trim() === "" ? Number.NaN : Number(values.holdHours);
  const parsed = transferSchema.safeParse({ ...values, enabled: formData.get("enabled") === "on", holdHours: hold });
  if (!parsed.success) return { fields: fieldsOf(parsed.error), values };
  await saveSetting("transferencia", parsed.data);
  refresh();
  return {
    success: parsed.data.enabled ? "Guardamos los datos. La transferencia ya se ofrece en el pago." : "Guardamos los datos. La transferencia está desactivada: no se ofrece en el pago.",
    values,
  };
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

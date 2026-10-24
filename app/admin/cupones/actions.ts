"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { couponFormSchema, deleteCoupon, saveCoupon } from "@/lib/admin/coupons";
import { adminUser, noPermission } from "@/lib/admin/guard";
import type { FormState } from "@/lib/auth/actions";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

export async function saveCouponAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await adminUser())) return noPermission;
  const values = Object.fromEntries(["code", "type", "value", "minSubtotal", "startsAt", "endsAt", "usageLimit"].map((k) => [k, text(formData, k)]));
  const parsed = couponFormSchema.safeParse({ ...values, id: text(formData, "id") || undefined, isActive: formData.get("isActive") === "on" });
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { fields, values };
  }
  const result = await saveCoupon(parsed.data);
  if (!result.ok) return { error: result.message, fields: result.fields, values };
  revalidatePath("/admin/cupones");
  if (!parsed.data.id) redirect("/admin/cupones?creado=1");
  return { success: "Guardamos el cupón.", values };
}

export async function deleteCouponAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await adminUser())) return noPermission;
  const result = await deleteCoupon(text(formData, "id"));
  if (result.ok) redirect("/admin/cupones");
  return { error: result.message };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { name, phone } from "../auth/schemas";
import { getCurrentUser } from "../auth";
import type { FormState } from "../auth/actions";
import { db } from "../db";
import { departamentos } from "../geo/departamentos";

const addressSchema = z.object({
  nombre: name,
  telefono: phone,
  departamento: z.enum(departamentos, { error: "Elige un departamento." }),
  municipio: z.string().trim().min(2, "Escribe el municipio.").max(60),
  direccion: z.string().trim().min(5, "Escribe la dirección completa: zona, calle, número de casa.").max(200),
  referencia: z.string().trim().max(200).optional(),
});

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

async function requireAccountUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?volver=/cuenta/direcciones");
  return user;
}

export async function saveAddressAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAccountUser();
  const values = Object.fromEntries(["nombre", "telefono", "departamento", "municipio", "direccion", "referencia"].map((k) => [k, text(formData, k)]));
  const parsed = addressSchema.safeParse(values);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { fields, values };
  }

  const id = text(formData, "id");
  const data = { ...parsed.data, referencia: parsed.data.referencia || null };
  if (id) {
    // Solo se edita una dirección propia.
    const owned = await db.address.findFirst({ where: { id, userId: user.id }, select: { id: true } });
    if (!owned) return { error: "No encontramos esa dirección." };
    await db.address.update({ where: { id }, data });
  } else {
    const count = await db.address.count({ where: { userId: user.id } });
    if (count >= 10) return { error: "Puedes guardar hasta 10 direcciones. Elimina alguna para agregar otra." };
    await db.address.create({ data: { ...data, userId: user.id, esPredeterminada: count === 0 } });
  }
  revalidatePath("/cuenta/direcciones");
  return { success: id ? "Actualizamos la dirección." : "Guardamos la dirección." };
}

export async function deleteAddressAction(formData: FormData): Promise<void> {
  const user = await requireAccountUser();
  const id = text(formData, "id");
  const address = await db.address.findFirst({ where: { id, userId: user.id } });
  if (!address) return;
  await db.address.delete({ where: { id } });
  if (address.esPredeterminada) {
    const next = await db.address.findFirst({ where: { userId: user.id }, orderBy: { id: "asc" } });
    if (next) await db.address.update({ where: { id: next.id }, data: { esPredeterminada: true } });
  }
  revalidatePath("/cuenta/direcciones");
}

export async function setDefaultAddressAction(formData: FormData): Promise<void> {
  const user = await requireAccountUser();
  const id = text(formData, "id");
  const address = await db.address.findFirst({ where: { id, userId: user.id } });
  if (!address) return;
  await db.$transaction([
    db.address.updateMany({ where: { userId: user.id }, data: { esPredeterminada: false } }),
    db.address.update({ where: { id }, data: { esPredeterminada: true } }),
  ]);
  revalidatePath("/cuenta/direcciones");
}

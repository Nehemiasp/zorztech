import { z } from "zod";
import { db } from "../db";
import { departamentos } from "../geo/departamentos";
import { parseGTQ } from "../money";
import type { BannerInput } from "../settings";

// --- Tarifas de envío -------------------------------------------------------------------

export const ratesFormSchema = z.record(
  z.enum(departamentos),
  z.object({ price: z.string().trim(), days: z.string().trim() }),
);

export type RatesResult = { ok: true; saved: number; removed: number } | { ok: false; fields: Record<string, string> };

/**
 * Guarda las tarifas de los 22 departamentos. Un precio vacío significa "no enviamos ahí": la tarifa se
 * quita y el checkout ofrece solo recogida en tienda para ese departamento.
 */
export async function saveRates(input: z.infer<typeof ratesFormSchema>): Promise<RatesResult> {
  const fields: Record<string, string> = {};
  const toSave: { departamento: string; price: number; estimatedDays: number }[] = [];
  const toRemove: string[] = [];

  for (const departamento of departamentos) {
    const row = input[departamento] ?? { price: "", days: "" };
    if (!row.price && !row.days) {
      toRemove.push(departamento);
      continue;
    }
    const price = row.price === "" ? null : parseGTQ(row.price);
    const days = Number(row.days);
    if (price === null) fields[`${departamento}.price`] = "Escribe el costo en quetzales, por ejemplo 45.00 (0 si es gratis).";
    if (!Number.isInteger(days) || days < 1 || days > 30) fields[`${departamento}.days`] = "Escribe los días de entrega, de 1 a 30.";
    if (price !== null && Number.isInteger(days) && days >= 1 && days <= 30) toSave.push({ departamento, price, estimatedDays: days });
  }
  if (Object.keys(fields).length > 0) return { ok: false, fields };

  await db.$transaction([
    ...toSave.map((r) => db.shippingRate.upsert({ where: { departamento: r.departamento }, update: r, create: r })),
    db.shippingRate.deleteMany({ where: { departamento: { in: toRemove } } }),
  ]);
  return { ok: true, saved: toSave.length, removed: toRemove.length };
}

// --- Tiendas para recoger ---------------------------------------------------------------

export const pickupSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Escribe el nombre de la tienda.").max(80, "Usa hasta 80 caracteres."),
  address: z.string().trim().min(5, "Escribe la dirección completa.").max(200, "Usa hasta 200 caracteres."),
  hours: z.string().trim().min(3, "Escribe el horario.").max(120, "Usa hasta 120 caracteres."),
  isActive: z.boolean(),
});
export type PickupInput = z.infer<typeof pickupSchema>;

export async function savePickup(input: PickupInput): Promise<{ ok: boolean; message?: string }> {
  const data = { name: input.name, address: input.address, hours: input.hours, isActive: input.isActive };
  if (input.id) {
    const found = await db.pickupLocation.findUnique({ where: { id: input.id }, select: { id: true } });
    if (!found) return { ok: false, message: "Esa tienda ya no existe." };
    await db.pickupLocation.update({ where: { id: input.id }, data });
  } else {
    await db.pickupLocation.create({ data });
  }
  return { ok: true };
}

/** Una tienda que ya tuvo pedidos se desactiva en lugar de borrarse, para conservar el historial. */
export async function removePickup(id: string): Promise<{ ok: boolean; message: string }> {
  const location = await db.pickupLocation.findUnique({ where: { id }, include: { _count: { select: { orders: true } } } });
  if (!location) return { ok: false, message: "Esa tienda ya no existe." };
  if (location._count.orders > 0) {
    await db.pickupLocation.update({ where: { id }, data: { isActive: false } });
    return { ok: true, message: "Tiene pedidos, así que la desactivamos en lugar de borrarla." };
  }
  await db.pickupLocation.delete({ where: { id } });
  return { ok: true, message: "Borramos la tienda." };
}

// --- Banner ------------------------------------------------------------------------------

export async function saveHeroBanner(input: BannerInput): Promise<void> {
  const data = {
    slot: "hero",
    title: input.title,
    body: input.body,
    ctaLabel: input.ctaLabel,
    ctaHref: input.ctaHref,
    imageUrl: input.imageUrl || null,
    imageAlt: input.imageAlt,
    isActive: input.isActive,
  };
  const current = await db.banner.findFirst({ where: { slot: "hero" }, orderBy: { order: "asc" } });
  if (current) await db.banner.update({ where: { id: current.id }, data });
  else await db.banner.create({ data });
}

export async function resetHeroBanner(): Promise<void> {
  await db.banner.deleteMany({ where: { slot: "hero" } });
}

import { z } from "zod";
import { couponCodeSchema } from "../coupons";
import { db } from "../db";
import { Prisma } from "../generated/prisma/client";
import { parseGTQ } from "../money";
import { endOfDayGT, startOfDayGT } from "./dates";

export const couponFormSchema = z
  .object({
    id: z.string().optional(),
    code: couponCodeSchema,
    type: z.enum(["porcentaje", "monto"], { error: "Elige el tipo de descuento." }),
    value: z.string().trim().min(1, "Escribe el valor del descuento."),
    minSubtotal: z.string().trim(),
    startsAt: z.string().trim(),
    endsAt: z.string().trim(),
    usageLimit: z.string().trim(),
    isActive: z.boolean(),
  })
  .transform((f, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });

    let value = 0;
    if (f.type === "porcentaje") {
      const n = Number(f.value);
      if (!Number.isInteger(n) || n < 1 || n > 100) issue("value", "Escribe un porcentaje entero entre 1 y 100.");
      else value = n;
    } else {
      const cents = parseGTQ(f.value);
      if (cents === null || cents <= 0) issue("value", "Escribe el monto en quetzales, por ejemplo 50.00.");
      else value = cents;
    }

    let minSubtotal = 0;
    if (f.minSubtotal) {
      const cents = parseGTQ(f.minSubtotal);
      if (cents === null) issue("minSubtotal", "Escribe el mínimo en quetzales, por ejemplo 500.00.");
      else minSubtotal = cents;
    }

    const startsAt = f.startsAt ? startOfDayGT(f.startsAt) : null;
    const endsAt = f.endsAt ? endOfDayGT(f.endsAt) : null;
    if (f.startsAt && !startsAt) issue("startsAt", "Elige una fecha válida.");
    if (f.endsAt && !endsAt) issue("endsAt", "Elige una fecha válida.");
    if (startsAt && endsAt && endsAt < startsAt) issue("endsAt", "La fecha final debe ser igual o posterior a la inicial.");

    let usageLimit: number | null = null;
    if (f.usageLimit) {
      const n = Number(f.usageLimit);
      if (!Number.isInteger(n) || n < 1 || n > 1_000_000) issue("usageLimit", "Escribe un número entero de usos, de 1 en adelante.");
      else usageLimit = n;
    }

    return { id: f.id, code: f.code, type: f.type, value, minSubtotal, startsAt, endsAt, usageLimit, isActive: f.isActive };
  });

export type CouponFormInput = z.output<typeof couponFormSchema>;

export async function listCoupons() {
  return db.coupon.findMany({ orderBy: [{ isActive: "desc" }, { code: "asc" }] });
}

export type SaveCouponResult = { ok: true; id: string } | { ok: false; fields?: Record<string, string>; message?: string };

export async function saveCoupon(input: CouponFormInput): Promise<SaveCouponResult> {
  const existing = input.id ? await db.coupon.findUnique({ where: { id: input.id } }) : null;
  if (input.id && !existing) return { ok: false, message: "Este cupón ya no existe." };
  if (existing && input.usageLimit !== null && input.usageLimit < existing.usedCount) {
    return { ok: false, fields: { usageLimit: `Ya se usó ${existing.usedCount} veces: el límite no puede ser menor.` } };
  }
  const data = {
    code: input.code,
    type: input.type,
    value: input.value,
    minSubtotal: input.minSubtotal,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    usageLimit: input.usageLimit,
    isActive: input.isActive,
  };
  try {
    const saved = existing ? await db.coupon.update({ where: { id: existing.id }, data }) : await db.coupon.create({ data });
    return { ok: true, id: saved.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, fields: { code: "Ya existe un cupón con ese código." } };
    throw error;
  }
}

/** Un cupón con pedidos se desactiva, no se borra: el historial de esos pedidos lo conserva. */
export async function deleteCoupon(id: string): Promise<{ ok: boolean; message: string }> {
  const coupon = await db.coupon.findUnique({ where: { id }, include: { _count: { select: { orders: true } } } });
  if (!coupon) return { ok: false, message: "Este cupón ya no existe." };
  if (coupon._count.orders > 0) return { ok: false, message: `Se usó en ${coupon._count.orders} pedidos. Desactívalo en lugar de borrarlo.` };
  await db.coupon.delete({ where: { id } });
  return { ok: true, message: "Borramos el cupón." };
}

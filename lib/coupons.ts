import { z } from "zod";
import { formatGTQ } from "./money";
import { couponDiscount } from "./orders/totals";

export interface CouponRules {
  code: string;
  type: "porcentaje" | "monto";
  value: number;
  minSubtotal: number;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
}

export type CouponCheck = { ok: true; discount: number } | { ok: false; message: string };

const dateFormat = new Intl.DateTimeFormat("es-GT", { dateStyle: "long", timeZone: "America/Guatemala" });

/** ¿Se puede usar este cupón con este subtotal ahora? Devuelve el descuento o el motivo, en palabras del cliente. */
export function evaluateCoupon(coupon: CouponRules | null, subtotal: number, now = new Date()): CouponCheck {
  if (!coupon || !coupon.isActive) return { ok: false, message: "Ese cupón no existe o ya no está disponible." };
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, message: `Ese cupón empieza el ${dateFormat.format(coupon.startsAt)}.` };
  if (coupon.endsAt && coupon.endsAt < now) return { ok: false, message: "Ese cupón ya venció." };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return { ok: false, message: "Ese cupón ya se usó el máximo de veces." };
  if (subtotal < coupon.minSubtotal) return { ok: false, message: `Ese cupón aplica a compras desde ${formatGTQ(coupon.minSubtotal)}.` };
  const discount = couponDiscount(coupon.type, coupon.value, subtotal);
  if (discount <= 0) return { ok: false, message: "Ese cupón no genera descuento en tu carrito." };
  return { ok: true, discount };
}

export const normalizeCouponCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, "");

export const couponLabel = (c: Pick<CouponRules, "type" | "value">) => (c.type === "porcentaje" ? `${c.value} % de descuento` : `${formatGTQ(c.value)} de descuento`);

/** Reglas del formulario del panel (el monto llega en quetzales como texto). */
export const couponCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{3,30}$/, "Usa de 3 a 30 letras, números, guion o guion bajo, sin espacios.");

import { test } from "node:test";
import assert from "node:assert/strict";
import { couponCodeSchema, evaluateCoupon, normalizeCouponCode, type CouponRules } from "./coupons";

const base: CouponRules = { code: "BIENVENIDO", type: "porcentaje", value: 10, minSubtotal: 0, startsAt: null, endsAt: null, usageLimit: null, usedCount: 0, isActive: true };
const now = new Date("2026-10-24T12:00:00Z");

test("aplica el porcentaje redondeando hacia abajo", () => {
  assert.deepEqual(evaluateCoupon(base, 12345, now), { ok: true, discount: 1234 });
});

test("un cupón de monto fijo nunca supera el subtotal", () => {
  const c = { ...base, type: "monto" as const, value: 50000 };
  assert.deepEqual(evaluateCoupon(c, 30000, now), { ok: true, discount: 30000 });
});

test("rechaza cupones inexistentes, desactivados, vencidos o aún no vigentes", () => {
  assert.ok(!evaluateCoupon(null, 1000, now).ok);
  assert.ok(!evaluateCoupon({ ...base, isActive: false }, 10000, now).ok);
  const expired = evaluateCoupon({ ...base, endsAt: new Date("2026-10-01T00:00:00Z") }, 10000, now);
  assert.ok(!expired.ok && /venció/.test(expired.message));
  const future = evaluateCoupon({ ...base, startsAt: new Date("2026-11-01T00:00:00Z") }, 10000, now);
  assert.ok(!future.ok && /empieza/.test(future.message));
});

test("respeta el límite de usos y el subtotal mínimo", () => {
  const used = evaluateCoupon({ ...base, usageLimit: 5, usedCount: 5 }, 10000, now);
  assert.ok(!used.ok && /máximo de veces/.test(used.message));
  assert.ok(evaluateCoupon({ ...base, usageLimit: 5, usedCount: 4 }, 10000, now).ok);
  const min = evaluateCoupon({ ...base, minSubtotal: 50000 }, 40000, now);
  assert.ok(!min.ok && /Q\s*500\.00/.test(min.message));
  assert.ok(evaluateCoupon({ ...base, minSubtotal: 50000 }, 50000, now).ok);
});

test("los códigos se normalizan a mayúsculas sin espacios", () => {
  assert.equal(normalizeCouponCode("  bienvenido 10 "), "BIENVENIDO10");
  assert.equal(couponCodeSchema.safeParse("oferta-10").data, "OFERTA-10");
  assert.ok(!couponCodeSchema.safeParse("ab").success);
  assert.ok(!couponCodeSchema.safeParse("con espacio").success);
});

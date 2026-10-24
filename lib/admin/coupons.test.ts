import { test } from "node:test";
import assert from "node:assert/strict";
import { couponFormSchema } from "./coupons";

const base = { code: "bienvenido10", type: "porcentaje", value: "10", minSubtotal: "", startsAt: "", endsAt: "", usageLimit: "", isActive: true };

test("normaliza el código y convierte los valores", () => {
  const r = couponFormSchema.safeParse({ ...base, type: "monto", value: "50.00", minSubtotal: "500", startsAt: "2026-11-01", endsAt: "2026-11-30", usageLimit: "100" });
  assert.ok(r.success);
  assert.equal(r.data.code, "BIENVENIDO10");
  assert.equal(r.data.value, 5000);
  assert.equal(r.data.minSubtotal, 50000);
  assert.equal(r.data.startsAt?.toISOString(), "2026-11-01T06:00:00.000Z");
  assert.equal(r.data.endsAt?.toISOString(), "2026-12-01T05:59:59.999Z");
  assert.equal(r.data.usageLimit, 100);
});

test("el porcentaje debe ser un entero de 1 a 100", () => {
  for (const bad of ["0", "101", "10.5", "abc"]) assert.ok(!couponFormSchema.safeParse({ ...base, value: bad }).success, bad);
  assert.ok(couponFormSchema.safeParse({ ...base, value: "100" }).success);
});

test("el monto fijo se escribe en quetzales y debe ser mayor que cero", () => {
  assert.ok(!couponFormSchema.safeParse({ ...base, type: "monto", value: "0" }).success);
  assert.ok(!couponFormSchema.safeParse({ ...base, type: "monto", value: "12.345" }).success);
});

test("la fecha final no puede ser anterior a la inicial", () => {
  assert.ok(!couponFormSchema.safeParse({ ...base, startsAt: "2026-12-01", endsAt: "2026-11-01" }).success);
  assert.ok(couponFormSchema.safeParse({ ...base, startsAt: "2026-12-01", endsAt: "2026-12-01" }).success);
});

test("el límite de usos es opcional pero entero positivo", () => {
  assert.equal((couponFormSchema.safeParse(base) as { data: { usageLimit: null } }).data.usageLimit, null);
  assert.ok(!couponFormSchema.safeParse({ ...base, usageLimit: "0" }).success);
  assert.ok(!couponFormSchema.safeParse({ ...base, usageLimit: "1.5" }).success);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateTotals, couponDiscount } from "./totals";

test("suma líneas y envío", () => {
  const t = calculateTotals(
    [
      { unitPrice: 249900, quantity: 1 },
      { unitPrice: 7900, quantity: 3 },
    ],
    3500,
  );
  assert.deepEqual(t, { subtotal: 273600, shippingCost: 3500, discount: 0, total: 277100 });
});

test("recogida en tienda no paga envío", () => {
  assert.equal(calculateTotals([{ unitPrice: 10000, quantity: 2 }], 0).total, 20000);
});

test("el descuento no supera el subtotal ni toca el envío", () => {
  const t = calculateTotals([{ unitPrice: 10000, quantity: 1 }], 2500, 99999);
  assert.equal(t.discount, 10000);
  assert.equal(t.total, 2500);
});

test("rechaza montos con decimales o negativos", () => {
  assert.throws(() => calculateTotals([{ unitPrice: 100.5, quantity: 1 }], 0));
  assert.throws(() => calculateTotals([{ unitPrice: 100, quantity: -1 }], 0));
  assert.throws(() => calculateTotals([{ unitPrice: 100, quantity: 1 }], -5));
});

test("cupones: porcentaje redondea hacia abajo y monto se limita al subtotal", () => {
  assert.equal(couponDiscount("porcentaje", 10, 12345), 1234);
  assert.equal(couponDiscount("monto", 50000, 30000), 30000);
  assert.equal(couponDiscount("monto", 5000, 30000), 5000);
});

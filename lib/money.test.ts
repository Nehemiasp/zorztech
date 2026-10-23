import { test } from "node:test";
import assert from "node:assert/strict";
import { discountPercent, formatGTQ } from "./money";

test("formatea centavos como quetzales", () => {
  assert.equal(formatGTQ(129900), "Q 1,299.00");
  assert.equal(formatGTQ(5), "Q 0.05");
  assert.equal(formatGTQ(0), "Q 0.00");
});

test("rechaza montos que no son enteros", () => {
  assert.throws(() => formatGTQ(1299.5));
});

test("calcula el porcentaje de ahorro", () => {
  assert.equal(discountPercent(10000, 8000), 20);
  assert.equal(discountPercent(8000, 8000), 0);
  assert.equal(discountPercent(7000, 8000), 0);
});

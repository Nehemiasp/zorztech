import { test } from "node:test";
import assert from "node:assert/strict";
import { centsToInput, discountPercent, formatGTQ, parseGTQ } from "./money";

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

test("lee precios escritos en quetzales", () => {
  assert.equal(parseGTQ("1299"), 129900);
  assert.equal(parseGTQ("1,299.50"), 129950);
  assert.equal(parseGTQ("Q 12.5"), 1250);
  assert.equal(parseGTQ(" 0.05 "), 5);
  assert.equal(parseGTQ("1,299"), 129900);
});

test("rechaza precios inválidos", () => {
  for (const bad of ["", "abc", "12.555", "-5", "1,29", "1.299,00", "12,34.5.6"]) assert.equal(parseGTQ(bad), null, bad);
});

test("convierte centavos a texto editable y de vuelta", () => {
  assert.equal(centsToInput(129900), "1299.00");
  assert.equal(parseGTQ(centsToInput(7905)), 7905);
});

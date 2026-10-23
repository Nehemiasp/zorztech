import { test } from "node:test";
import assert from "node:assert/strict";
import { availableUnits, productAvailability } from "./availability";

const v = (stock: number, reservedStock = 0, lowStockThreshold = 3) => ({ stock, reservedStock, lowStockThreshold });

test("el stock reservado no se puede vender", () => {
  assert.equal(availableUnits(v(10, 4)), 6);
  assert.equal(availableUnits(v(2, 2)), 0);
});

test("sin unidades vendibles el producto está agotado", () => {
  assert.equal(productAvailability([v(0), v(5, 5)]), "agotado");
  assert.equal(productAvailability([]), "agotado");
});

test("últimas unidades solo si todas las variantes vendibles tienen stock bajo", () => {
  assert.equal(productAvailability([v(2), v(0)]), "ultimas");
  assert.equal(productAvailability([v(2), v(20)]), "disponible");
  assert.equal(productAvailability([v(3)]), "ultimas");
  assert.equal(productAvailability([v(4)]), "disponible");
});

test("una variante agotada no impide que el producto esté disponible", () => {
  assert.equal(productAvailability([v(0), v(12)]), "disponible");
});

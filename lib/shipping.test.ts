import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { amountToFreeShipping, defaultShipping, homeShippingCost } from "./shipping";

const s = { flatRate: 3500, freeFrom: 40000, deliveryTime: "" };

describe("envío a domicilio", () => {
  test("cobra la tarifa general bajo el monto de envío gratis", () => {
    assert.equal(homeShippingCost(0, s), 3500);
    assert.equal(homeShippingCost(39999, s), 3500);
  });

  test("es gratis desde el monto exacto y por encima", () => {
    assert.equal(homeShippingCost(40000, s), 0);
    assert.equal(homeShippingCost(250000, s), 0);
  });

  test("sin monto de envío gratis (0) siempre cobra la tarifa", () => {
    const sin = { ...s, freeFrom: 0 };
    assert.equal(homeShippingCost(0, sin), 3500);
    assert.equal(homeShippingCost(1_000_000, sin), 3500);
  });

  test("una tarifa de 0 significa envío gratis para todos", () => {
    assert.equal(homeShippingCost(100, { ...s, flatRate: 0 }), 0);
  });

  test("calcula cuánto falta para el envío gratis", () => {
    assert.equal(amountToFreeShipping(15000, s), 25000);
    assert.equal(amountToFreeShipping(40000, s), 0);
    assert.equal(amountToFreeShipping(90000, s), 0);
    assert.equal(amountToFreeShipping(100, { ...s, freeFrom: 0 }), 0);
  });

  test("los valores de partida son Q 35 y gratis desde Q 400", () => {
    assert.equal(defaultShipping.flatRate, 3500);
    assert.equal(defaultShipping.freeFrom, 40000);
  });
});

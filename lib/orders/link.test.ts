import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { orderToken, orderViewUrl, validOrderToken } from "./link";

describe("enlace directo al pedido", () => {
  test("el token es estable para un pedido y distinto entre pedidos", () => {
    assert.equal(orderToken("ZT-AAAA1111"), orderToken("ZT-AAAA1111"));
    assert.notEqual(orderToken("ZT-AAAA1111"), orderToken("ZT-BBBB2222"));
    assert.equal(orderToken("ZT-AAAA1111").length, 32);
  });

  test("solo vale para el pedido para el que se firmó", () => {
    const token = orderToken("ZT-AAAA1111");
    assert.equal(validOrderToken("ZT-AAAA1111", token), true);
    assert.equal(validOrderToken("ZT-BBBB2222", token), false);
  });

  test("rechaza tokens vacíos, cortos o alterados", () => {
    const token = orderToken("ZT-AAAA1111");
    assert.equal(validOrderToken("ZT-AAAA1111", undefined), false);
    assert.equal(validOrderToken("ZT-AAAA1111", ""), false);
    assert.equal(validOrderToken("ZT-AAAA1111", token.slice(0, 31)), false);
    assert.equal(validOrderToken("ZT-AAAA1111", `${token.slice(0, 31)}${token.endsWith("a") ? "b" : "a"}`), false);
  });

  test("la dirección incluye el código y el token", () => {
    const url = orderViewUrl("ZT-AAAA1111");
    assert.match(url, /\/pedido\/ZT-AAAA1111\/confirmacion\?t=[a-f0-9]{32}$/);
  });
});

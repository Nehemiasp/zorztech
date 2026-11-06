import assert from "node:assert/strict";
import { test } from "node:test";
import { isRealPickup } from "./pickup";

test("una tienda con la dirección todavía en marcador no es real", () => {
  assert.equal(isRealPickup({ address: "[Dirección de la tienda]" }), false);
  assert.equal(isRealPickup({ address: "  [Dirección]" }), false);
});

test("una tienda con dirección escrita sí se ofrece", () => {
  assert.equal(isRealPickup({ address: "6a avenida 12-34, zona 1" }), true);
});

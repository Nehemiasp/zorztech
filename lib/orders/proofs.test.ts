import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { readProofs } from "./proofs";

describe("comprobantes en el registro del pago", () => {
  test("sin comprobantes devuelve una lista vacía", () => {
    assert.deepEqual(readProofs(null), []);
    assert.deepEqual(readProofs({ checkout: { kind: "transfer" } }), []);
    assert.deepEqual(readProofs({ proofs: "no es una lista" }), []);
  });

  test("ignora entradas que no tienen la forma esperada", () => {
    const good = { type: "image/png", size: 10, uploadedAt: "2026-11-05T00:00:00.000Z", data: "AAAA" };
    assert.deepEqual(readProofs({ proofs: [good, null, { type: 1 }, { data: "x" }] }), [good]);
  });
});

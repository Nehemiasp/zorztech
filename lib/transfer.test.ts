import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { defaultTransfer, holdText, TRANSFER_METHOD_ID, transferMethod, transferReady, transferSchema } from "./transfer";

const bank = { enabled: true, bankName: "Banco de ejemplo", accountName: "Titular de ejemplo", accountNumber: "0123456789", accountType: "", instructions: "", holdHours: 24 };

describe("pago por transferencia", () => {
  test("por defecto no se ofrece", () => {
    assert.equal(transferReady(defaultTransfer), false);
  });

  test("se ofrece solo con la cuenta completa y activa", () => {
    assert.equal(transferReady(bank), true);
    assert.equal(transferReady({ ...bank, enabled: false }), false);
    assert.equal(transferReady({ ...bank, accountNumber: "" }), false);
    assert.equal(transferReady({ ...bank, bankName: "" }), false);
  });

  test("activarla exige banco, titular y número de cuenta", () => {
    const empty = transferSchema.safeParse({ ...bank, bankName: "", accountName: "", accountNumber: "" });
    assert.ok(!empty.success);
    assert.deepEqual(empty.error.issues.map((i) => i.path[0]).sort(), ["accountName", "accountNumber", "bankName"]);
  });

  test("desactivada se puede guardar sin datos", () => {
    assert.ok(transferSchema.safeParse({ ...defaultTransfer, enabled: false }).success);
  });

  test("las horas de apartado van de 1 a 168", () => {
    assert.ok(!transferSchema.safeParse({ ...bank, holdHours: 0 }).success);
    assert.ok(!transferSchema.safeParse({ ...bank, holdHours: 200 }).success);
    assert.ok(!transferSchema.safeParse({ ...bank, holdHours: 1.5 }).success);
    assert.ok(transferSchema.safeParse({ ...bank, holdHours: 48 }).success);
  });

  test("el método tiene su propio identificador y explica cuánto se aparta el pedido", () => {
    const m = transferMethod(bank);
    assert.equal(m.id, TRANSFER_METHOD_ID);
    assert.match(m.description, /1 día/);
    assert.equal(holdText(48), "2 días");
    assert.equal(holdText(12), "12 horas");
    assert.equal(holdText(1), "1 hora");
  });
});

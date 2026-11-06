import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { getPaymentMethods, mockPaymentVisible } from "./index";

const env = process.env as Record<string, string | undefined>;
const saved = { NODE_ENV: env.NODE_ENV, PAYMENT_PROVIDER: env.PAYMENT_PROVIDER, SHOW_MOCK_PAYMENT: env.SHOW_MOCK_PAYMENT };

afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete env[k];
    else env[k] = v;
  }
});

describe("pasarela simulada", () => {
  test("en desarrollo se ofrece", () => {
    env.NODE_ENV = "development";
    env.PAYMENT_PROVIDER = "mock";
    delete env.SHOW_MOCK_PAYMENT;
    assert.equal(mockPaymentVisible(), true);
    assert.equal(getPaymentMethods().length, 1);
  });

  test("en producción está oculta y no ofrece ninguna forma de pago", () => {
    env.NODE_ENV = "production";
    env.PAYMENT_PROVIDER = "mock";
    delete env.SHOW_MOCK_PAYMENT;
    assert.equal(mockPaymentVisible(), false);
    assert.deepEqual(getPaymentMethods(), []);
  });

  test("en producción solo aparece si se pide a propósito", () => {
    env.NODE_ENV = "production";
    env.PAYMENT_PROVIDER = "mock";
    env.SHOW_MOCK_PAYMENT = "1";
    assert.equal(mockPaymentVisible(), true);
    assert.equal(getPaymentMethods().length, 1);
  });

  test("cualquier otro valor de SHOW_MOCK_PAYMENT no la muestra", () => {
    env.NODE_ENV = "production";
    env.PAYMENT_PROVIDER = "mock";
    env.SHOW_MOCK_PAYMENT = "true";
    assert.equal(mockPaymentVisible(), false);
  });
});

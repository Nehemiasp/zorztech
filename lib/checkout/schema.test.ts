import { test } from "node:test";
import assert from "node:assert/strict";
import { billingSchema, checkoutSchema, contactSchema, deliverySchema } from "./schema";

const valid = {
  contact: { name: "Ana López", email: "Ana@Correo.com ", phone: "5555 1234" },
  delivery: { method: "domicilio", nombre: "Ana López", telefono: "+502 5555-1234", departamento: "Guatemala", municipio: "Mixco", direccion: "Zona 1, 5a calle 3-20" },
  billing: { taxId: "cf", taxName: "Ana López" },
  paymentMethod: "simulado",
  acceptTerms: true,
  expectedTotal: 250000,
  idempotencyKey: "0b8f9f4e-6c3a-4a62-9a53-1f6c3a1d9e11",
};

test("acepta un pedido válido y normaliza correo, teléfono y CF", () => {
  const r = checkoutSchema.safeParse(valid);
  assert.ok(r.success);
  assert.equal(r.data.contact.email, "ana@correo.com");
  assert.equal(r.data.contact.phone, "55551234");
  assert.equal(r.data.billing.taxId, "CF");
});

test("valida NIT con y sin guion, y rechaza texto", () => {
  for (const ok of ["1234567-8", "12345678", "1234567-K", "CF", "cf"]) {
    assert.ok(billingSchema.safeParse({ taxId: ok, taxName: "Ana" }).success, ok);
  }
  for (const bad of ["abc", "12", "1234567-89", ""]) {
    assert.ok(!billingSchema.safeParse({ taxId: bad, taxName: "Ana" }).success, bad);
  }
});

test("el teléfono debe ser guatemalteco de 8 dígitos", () => {
  assert.ok(contactSchema.safeParse({ ...valid.contact, phone: "12345" }).error);
  assert.ok(contactSchema.safeParse({ ...valid.contact, phone: "502 5555 1234" }).success);
});

test("la entrega a domicilio exige departamento válido y dirección", () => {
  assert.ok(deliverySchema.safeParse({ ...valid.delivery, departamento: "Atlantis" }).error);
  assert.ok(deliverySchema.safeParse({ ...valid.delivery, direccion: "x" }).error);
});

test("la recogida exige elegir tienda", () => {
  assert.ok(deliverySchema.safeParse({ method: "recogida", pickupLocationId: "" }).error);
  assert.ok(deliverySchema.safeParse({ method: "recogida", pickupLocationId: "abc" }).success);
});

test("sin aceptar los términos no se puede pagar", () => {
  const r = checkoutSchema.safeParse({ ...valid, acceptTerms: false });
  assert.ok(r.error);
  assert.match(r.error.issues[0].message, /Acepta los términos/);
});

test("el cliente no puede mandar precios: se ignoran campos desconocidos", () => {
  const r = checkoutSchema.safeParse({ ...valid, total: 1 });
  assert.ok(r.success);
  assert.ok(!("total" in r.data));
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { bannerSchema, contactSchema, inventorySchema } from "../settings";
import { pickupSchema } from "./config";

test("el banner solo admite enlaces propios o https", () => {
  const ok = { title: "Ofertas de temporada", body: "Hasta agotar existencias.", ctaLabel: "Ver ofertas", imageAlt: "", isActive: true };
  assert.ok(bannerSchema.safeParse({ ...ok, ctaHref: "/categorias/audio" }).success);
  assert.ok(bannerSchema.safeParse({ ...ok, ctaHref: "#categorias" }).success);
  assert.ok(bannerSchema.safeParse({ ...ok, ctaHref: "https://zorztech.example/promo" }).success);
  for (const bad of ["http://x.test", "//evil.test", "javascript:alert(1)", "promo"]) {
    assert.ok(!bannerSchema.safeParse({ ...ok, ctaHref: bad }).success, bad);
  }
});

test("el contacto acepta campos vacíos y rechaza un correo inválido", () => {
  assert.ok(contactSchema.safeParse({ phone: "", email: "", hours: "", socials: "", paymentMethods: "" }).success);
  assert.ok(!contactSchema.safeParse({ phone: "", email: "no-es-correo", hours: "", socials: "", paymentMethods: "" }).success);
});

test("el umbral de stock es un entero no negativo", () => {
  assert.equal(inventorySchema.parse({ lowStockDefault: "5" }).lowStockDefault, 5);
  assert.ok(!inventorySchema.safeParse({ lowStockDefault: "-1" }).success);
  assert.ok(!inventorySchema.safeParse({ lowStockDefault: "2.5" }).success);
});

test("una tienda necesita nombre, dirección y horario", () => {
  assert.ok(!pickupSchema.safeParse({ name: "", address: "x", hours: "", isActive: true }).success);
  assert.ok(pickupSchema.safeParse({ name: "Sucursal Centro", address: "6a avenida 12-34, zona 1", hours: "Lunes a sábado, 9:00 a 18:00", isActive: true }).success);
});

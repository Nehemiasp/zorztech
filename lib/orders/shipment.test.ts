import { test } from "node:test";
import assert from "node:assert/strict";
import { detectGuideType, shipmentSchema } from "./shipment";

const bytes = (...b: number[]) => new Uint8Array(b);
const text = (s: string) => new TextEncoder().encode(s);

test("la guía se reconoce por sus bytes: PDF, JPG, PNG o WebP", () => {
  assert.equal(detectGuideType(text("%PDF-1.7\n...")), "application/pdf");
  assert.equal(detectGuideType(bytes(0xff, 0xd8, 0xff, 0xe0)), "image/jpeg");
  assert.equal(detectGuideType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), "image/png");
  assert.equal(detectGuideType(text("RIFF\0\0\0\0WEBPVP8 ")), "image/webp");
});

test("otros archivos no pasan como guía", () => {
  assert.equal(detectGuideType(text("<html><script>alert(1)</script>")), null);
  assert.equal(detectGuideType(text("%PD")), null);
  assert.equal(detectGuideType(new Uint8Array()), null);
  // AVIF es imagen, pero no se acepta como guía.
  assert.equal(detectGuideType(text("\0\0\0\x1cftypavif")), null);
});

test("el número de guía es obligatorio y solo lleva caracteres de una guía", () => {
  assert.ok(shipmentSchema.safeParse({ trackingNumber: "GT-2026/0001 A" }).success);
  assert.ok(shipmentSchema.safeParse({ trackingNumber: "  123456789  " }).success, "se recortan los espacios");
  assert.ok(!shipmentSchema.safeParse({ trackingNumber: "" }).success);
  assert.ok(!shipmentSchema.safeParse({ trackingNumber: "12" }).success, "muy corto");
  assert.ok(!shipmentSchema.safeParse({ trackingNumber: "<b>123</b>" }).success);
  assert.ok(!shipmentSchema.safeParse({ trackingNumber: "x".repeat(61) }).success);
  assert.ok(!shipmentSchema.safeParse({ trackingNumber: "-123" }).success, "empieza con letra o número");
});

test("el correo de «enviado» lleva el número de guía y la empresa", async () => {
  const { orderStatusEmail } = await import("../email/templates");
  const base = {
    code: "ZT-ABC123",
    customerName: "Ana",
    email: "ana@correo.test",
    shippingMethod: "domicilio" as const,
    subtotal: 10000,
    shippingCost: 0,
    discount: 0,
    total: 10000,
    items: [{ productName: "Cable", variantName: "1 m", unitPrice: 10000, quantity: 1 }],
  };
  const shipped = orderStatusEmail({ ...base, status: "enviado", trackingNumber: "GT-1", carrier: "Paquetería <x>" })!;
  assert.match(shipped.text, /Número de guía: GT-1 \(Paquetería <x>\)/);
  assert.match(shipped.html, /GT-1 \(Paquetería &lt;x&gt;\)/, "el HTML escapa la empresa");
  const preparing = orderStatusEmail({ ...base, status: "en_preparacion", trackingNumber: "GT-1" })!;
  assert.doesNotMatch(preparing.text, /guía/i);
});

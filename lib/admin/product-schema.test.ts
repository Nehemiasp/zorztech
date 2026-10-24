import { test } from "node:test";
import assert from "node:assert/strict";
import { attributeKey, isAllowedImageUrl, productFieldErrors, productSchema } from "./product-schema";

const base = {
  name: "Audífonos de prueba",
  slug: "",
  brandId: null,
  categoryId: "cat1",
  description: "Descripción",
  specs: [{ clave: "Batería", valor: "30 horas" }],
  isActive: true,
  isFeatured: false,
  isSample: false,
  variants: [{ sku: "AUD-001", name: "Negro", attributes: [{ clave: "Color", valor: "Negro" }], price: "699.00", compareAtPrice: "849.00", stock: "10", lowStockThreshold: "3", isActive: true }],
  images: [{ url: "/api/uploads/0123456789abcdef01234567.webp", alt: "Audífonos negros de frente", variantSku: null }],
};

test("acepta un producto válido y convierte precios a centavos", () => {
  const r = productSchema.safeParse(base);
  assert.ok(r.success, r.success ? "" : JSON.stringify(productFieldErrors(r.error)));
  assert.equal(r.data.variants[0].price, 69900);
  assert.equal(r.data.variants[0].compareAtPrice, 84900);
  assert.equal(r.data.variants[0].stock, 10);
});

test("rechaza precios inválidos y un precio anterior menor al actual", () => {
  const bad = productSchema.safeParse({ ...base, variants: [{ ...base.variants[0], price: "12.555", compareAtPrice: "1" }] });
  assert.ok(!bad.success);
  const fields = productFieldErrors(bad.error);
  assert.match(fields["variants.0.price"], /quetzales/);
  const lower = productSchema.safeParse({ ...base, variants: [{ ...base.variants[0], compareAtPrice: "500.00" }] });
  assert.ok(!lower.success);
  assert.match(productFieldErrors(lower.error)["variants.0.compareAtPrice"], /mayor que el precio actual/);
});

test("exige al menos una variante y SKUs distintos", () => {
  assert.ok(!productSchema.safeParse({ ...base, variants: [] }).success);
  const dup = productSchema.safeParse({ ...base, variants: [base.variants[0], { ...base.variants[0], name: "Blanco" }] });
  assert.ok(!dup.success);
  assert.match(productFieldErrors(dup.error)["variants.1.sku"], /repetido/);
});

test("no admite atributos repetidos ni stock negativo", () => {
  const attrs = productSchema.safeParse({ ...base, variants: [{ ...base.variants[0], attributes: [{ clave: "Color", valor: "A" }, { clave: " color ", valor: "B" }] }] });
  assert.ok(!attrs.success);
  assert.ok(!productSchema.safeParse({ ...base, variants: [{ ...base.variants[0], stock: "-1" }] }).success);
});

test("solo acepta imágenes propias, no enlaces a sitios ajenos", () => {
  assert.ok(isAllowedImageUrl("/api/uploads/0123456789abcdef01234567.png"));
  assert.ok(isAllowedImageUrl("/img/placeholder/producto-1x1.svg"));
  assert.ok(isAllowedImageUrl("https://abc123.public.blob.vercel-storage.com/productos/x.webp"));
  for (const bad of ["https://evil.test/x.png", "http://abc.public.blob.vercel-storage.com/x.png", "//evil.test/x.png", "/api/uploads/../../etc/passwd", "javascript:alert(1)"]) {
    assert.ok(!isAllowedImageUrl(bad), bad);
  }
});

test("la imagen de una variante debe apuntar a una variante existente", () => {
  const r = productSchema.safeParse({ ...base, images: [{ ...base.images[0], variantSku: "NO-EXISTE" }] });
  assert.ok(!r.success);
});

test("la clave de un atributo se normaliza para los filtros", () => {
  assert.equal(attributeKey("Tipo de interruptor"), "tipo_de_interruptor");
  assert.equal(attributeKey(" Resolución "), "resolución");
  assert.equal(attributeKey("Color/Tono!"), "colortono");
});

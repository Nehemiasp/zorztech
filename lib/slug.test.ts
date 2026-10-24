import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify, uniqueSlug } from "./slug";

test("quita tildes, signos y espacios", () => {
  assert.equal(slugify("Audífonos inalámbricos ANC"), "audifonos-inalambricos-anc");
  assert.equal(slugify('  Smartphone 6.5" 5G  '), "smartphone-6-5-5g");
  assert.equal(slugify("Cámaras & accesorios"), "camaras-y-accesorios");
  assert.equal(slugify("¡¡¡"), "");
});

test("limita el largo sin dejar un guion al final", () => {
  const slug = slugify("palabra ".repeat(30));
  assert.ok(slug.length <= 80);
  assert.ok(!slug.endsWith("-"));
});

test("busca el primer slug libre", async () => {
  const taken = new Set(["cable", "cable-2"]);
  assert.equal(await uniqueSlug("cable", async (s) => taken.has(s)), "cable-3");
  assert.equal(await uniqueSlug("nuevo", async (s) => taken.has(s)), "nuevo");
  assert.equal(await uniqueSlug("", async () => false), "producto");
});

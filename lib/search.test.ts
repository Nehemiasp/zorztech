import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSearchText, normalizeText, searchTokens } from "./search";

test("normaliza tildes, mayúsculas y espacios", () => {
  assert.equal(normalizeText("  Audífonos   ANC "), "audifonos anc");
  assert.equal(normalizeText("Cámara de seguridad"), "camara de seguridad");
});

test("conserva medidas con punto y quita signos", () => {
  assert.equal(normalizeText('Smartphone 6.5" 5G'), "smartphone 6.5 5g");
});

test("separa la búsqueda en palabras únicas y limita su número", () => {
  assert.deepEqual(searchTokens("Audifonos audífonos  ANC"), ["audifonos", "anc"]);
  assert.equal(searchTokens("a b c d e f g h").length, 6);
  assert.deepEqual(searchTokens("  "), []);
});

test("el texto de búsqueda empieza por el nombre", () => {
  const text = buildSearchText({
    name: "Bocina Bluetooth",
    brand: "Marca A",
    categories: ["Audio", "Bocinas"],
    description: "Resistente al agua",
    variants: [{ name: "Negro", sku: "EJ-AUD-002-NEG" }],
  });
  assert.ok(text.startsWith("bocina bluetooth marca a audio bocinas"));
  assert.ok(text.includes("ej aud 002 neg"));
});

test("también indexa las palabras con guion sin el guion", () => {
  const text = buildSearchText({
    name: "Foco LED inteligente Wi-Fi",
    categories: ["Hogar inteligente"],
    description: "Cable USB-C",
    variants: [],
  });
  assert.ok(text.includes("wi fi"));
  assert.ok(text.includes("wifi"));
  assert.ok(text.includes("usbc"));
  assert.ok(text.startsWith("foco led inteligente wi fi"));
});

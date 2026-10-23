import { test } from "node:test";
import assert from "node:assert/strict";
import {
  attributeGroups,
  initialVariant,
  selectAttribute,
  variantSavings,
  withSelectableAttributes,
  type VariantView,
} from "./variants";

const v = (sku: string, attributes: Record<string, string>, available = 5, price = 1000): VariantView => ({
  id: sku,
  sku,
  name: Object.values(attributes).join(" "),
  attributes,
  price,
  compareAtPrice: null,
  available,
  lowStockThreshold: 3,
});

const phone = [
  v("A", { capacidad: "128 GB", color: "Negro" }),
  v("B", { capacidad: "128 GB", color: "Azul" }, 0),
  v("C", { capacidad: "256 GB", color: "Negro" }),
];

test("abre con la variante pedida, la primera con stock o la primera", () => {
  assert.equal(initialVariant(phone, "C").sku, "C");
  assert.equal(initialVariant(phone, "zzz").sku, "A");
  assert.equal(initialVariant([v("X", {}, 0), v("Y", {}, 3)]).sku, "Y");
  assert.equal(initialVariant([v("X", {}, 0), v("Y", {}, 0)]).sku, "X");
});

test("agrupa atributos y marca los valores sin unidades", () => {
  const groups = attributeGroups(phone);
  assert.deepEqual(groups.map((g) => g.key), ["capacidad", "color"]);
  const color = groups.find((g) => g.key === "color")!;
  assert.deepEqual(color.values, [
    { value: "Negro", available: true },
    { value: "Azul", available: false },
  ]);
});

test("cambiar un atributo conserva los demás si la combinación existe", () => {
  assert.equal(selectAttribute(phone, phone[0], "capacidad", "256 GB").sku, "C");
});

test("si la combinación no existe elige la que más coincide", () => {
  // 256 GB Azul no existe: se queda con 256 GB (Negro).
  assert.equal(selectAttribute(phone, phone[1], "capacidad", "256 GB").sku, "C");
});

test("prefiere la variante con unidades entre las que empatan", () => {
  const list = [v("P", { color: "Rojo" }, 0), v("Q", { color: "Rojo", extra: "x" }, 4)];
  assert.equal(selectAttribute(list, v("Z", {}), "color", "Rojo").sku, "Q");
});

test("un valor inexistente deja la selección como está", () => {
  assert.equal(selectAttribute(phone, phone[0], "color", "Verde").sku, "A");
});

test("variantes sin atributos se eligen por nombre", () => {
  const plain = [v("1", {}), v("2", {})].map((x, i) => ({ ...x, name: i ? "2 m" : "1 m" }));
  const list = withSelectableAttributes(plain);
  assert.deepEqual(attributeGroups(list)[0].values.map((x) => x.value), ["1 m", "2 m"]);
  assert.equal(withSelectableAttributes([v("solo", {})])[0].attributes.opcion, undefined);
});

test("calcula el ahorro solo si hay precio anterior mayor", () => {
  assert.equal(variantSavings({ price: 800, compareAtPrice: 1000 }), 200);
  assert.equal(variantSavings({ price: 800, compareAtPrice: null }), 0);
  assert.equal(variantSavings({ price: 800, compareAtPrice: 700 }), 0);
});

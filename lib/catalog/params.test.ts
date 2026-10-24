import { test } from "node:test";
import assert from "node:assert/strict";
import { filtersToQuery, hasActiveFilters, parseFilters } from "./params";

test("sin parámetros devuelve los valores por defecto", () => {
  const f = parseFilters({});
  assert.equal(f.orden, "relevancia");
  assert.equal(f.pagina, 1);
  assert.equal(f.q, "");
  assert.equal(hasActiveFilters(f), false);
});

test("lee filtros repetidos, precios y atributos", () => {
  const f = parseFilters({
    marca: ["marca-ejemplo-a", "marca-ejemplo-b"],
    desde: "100",
    hasta: "500",
    disponibles: "1",
    a_color: ["Negro", "Azul"],
    orden: "precio-asc",
    pagina: "3",
  });
  assert.deepEqual(f.marca, ["marca-ejemplo-a", "marca-ejemplo-b"]);
  assert.equal(f.desde, 100);
  assert.equal(f.hasta, 500);
  assert.equal(f.disponibles, true);
  assert.deepEqual(f.atributos, { color: ["Negro", "Azul"] });
  assert.equal(f.orden, "precio-asc");
  assert.equal(f.pagina, 3);
  assert.equal(hasActiveFilters(f), true);
});

test("descarta valores inválidos en vez de fallar", () => {
  const f = parseFilters({ orden: "al-azar", pagina: "-4", desde: "abc", "a_x y": "z", "a_x/y": "z" });
  assert.equal(f.orden, "relevancia");
  assert.equal(f.pagina, 1);
  assert.equal(f.desde, null);
  assert.deepEqual(f.atributos, {});
});

test("ordena el rango de precio si viene invertido", () => {
  const f = parseFilters({ desde: "900", hasta: "100" });
  assert.deepEqual([f.desde, f.hasta], [100, 900]);
});

test("recorta búsquedas excesivas", () => {
  assert.equal(parseFilters({ q: "x".repeat(500) }).q, "");
  assert.equal(parseFilters({ q: "  audífonos " }).q, "audífonos");
});

test("la query omite valores por defecto y se puede releer", () => {
  const f = parseFilters({ q: "cable", marca: "marca-ejemplo-b", a_largo: "2 m", orden: "nuevos", pagina: "2" });
  const query = filtersToQuery(f);
  assert.equal(filtersToQuery({}), "");
  const back = parseFilters(Object.fromEntries(new URLSearchParams(query)));
  assert.deepEqual(back, f);
});

test("un precio vacío no es un filtro", () => {
  const f = parseFilters({ desde: "", hasta: " " });
  assert.equal(f.desde, null);
  assert.equal(f.hasta, null);
  assert.equal(hasActiveFilters(f), false);
});

test("acepta claves de atributo con tildes", () => {
  const f = parseFilters({ "a_resolución": "2K" });
  assert.deepEqual(f.atributos, { "resolución": ["2K"] });
  const back = parseFilters(Object.fromEntries(new URLSearchParams(filtersToQuery(f))));
  assert.deepEqual(back, f);
});

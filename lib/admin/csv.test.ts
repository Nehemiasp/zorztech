import { test } from "node:test";
import assert from "node:assert/strict";
import { centsToDecimal, csvCell, toCsv } from "./csv";

test("entrecomilla comas, comillas y saltos de línea", () => {
  assert.equal(csvCell("Mixco, zona 1"), '"Mixco, zona 1"');
  assert.equal(csvCell('5" pantalla'), '"5"" pantalla"');
  assert.equal(csvCell("a\nb"), '"a\nb"');
  assert.equal(csvCell("simple"), "simple");
});

test("neutraliza fórmulas de hoja de cálculo", () => {
  assert.equal(csvCell("=HYPERLINK(\"http://malo\")").startsWith("\"'="), true);
  assert.equal(csvCell("+502 5555 1234"), "'+502 5555 1234");
  assert.equal(csvCell("@usuario"), "'@usuario");
  assert.equal(csvCell("-5"), "'-5");
  // Los números de verdad no se tocan.
  assert.equal(csvCell(-5), "-5");
});

test("celdas vacías y números", () => {
  assert.equal(csvCell(null), "");
  assert.equal(csvCell(undefined), "");
  assert.equal(csvCell(0), "0");
});

test("el CSV lleva BOM y termina en CRLF", () => {
  const csv = toCsv(["a", "b"], [["x", 1]]);
  assert.ok(csv.startsWith("﻿a,b\r\n"));
  assert.ok(csv.endsWith("x,1\r\n"));
});

test("convierte centavos a decimales exactos", () => {
  assert.equal(centsToDecimal(129900), "1299.00");
  assert.equal(centsToDecimal(5), "0.05");
  assert.equal(centsToDecimal(0), "0.00");
});

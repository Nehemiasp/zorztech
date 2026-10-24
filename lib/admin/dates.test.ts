import { test } from "node:test";
import assert from "node:assert/strict";
import { endOfDayGT, startOfDayGT, startOfTodayGT } from "./dates";

test("el día de Guatemala empieza a las 06:00 UTC", () => {
  assert.equal(startOfTodayGT(new Date("2026-10-24T20:00:00Z")).toISOString(), "2026-10-24T06:00:00.000Z");
});

test("a las 03:00 UTC todavía es el día anterior en Guatemala", () => {
  assert.equal(startOfTodayGT(new Date("2026-10-24T03:00:00Z")).toISOString(), "2026-10-23T06:00:00.000Z");
});

test("convierte fechas escritas y rechaza las inválidas", () => {
  assert.equal(startOfDayGT("2026-10-24")?.toISOString(), "2026-10-24T06:00:00.000Z");
  assert.equal(endOfDayGT("2026-10-24")?.toISOString(), "2026-10-25T05:59:59.999Z");
  assert.equal(startOfDayGT("24/10/2026"), null);
  assert.equal(startOfDayGT("2026-13-45"), null);
});

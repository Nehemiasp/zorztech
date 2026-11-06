import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { contactOrMarker, contactSchema, defaultContact, telHref } from "./settings";

describe("datos de contacto", () => {
  test("los datos iniciales son válidos y no están vacíos", () => {
    assert.ok(contactSchema.safeParse(defaultContact).success);
    for (const value of Object.values(defaultContact)) assert.ok(value.length > 0);
  });

  test("con datos cargados no se muestra ningún marcador", () => {
    const c = contactOrMarker(defaultContact);
    assert.ok(Object.values(c).every((item) => !item.pending));
  });

  test("un campo vacío vuelve a mostrar su marcador", () => {
    const c = contactOrMarker({ ...defaultContact, socials: "" });
    assert.equal(c.socials.pending, true);
    assert.match(c.socials.value, /^\[/);
  });

  test("el enlace del teléfono usa el prefijo de Guatemala para números de 8 dígitos", () => {
    assert.equal(telHref("4187 8256"), "tel:+50241878256");
    assert.equal(telHref("+502 4187-8256"), "tel:+50241878256");
    assert.equal(telHref("2222-5169"), "tel:+50222225169");
  });
});

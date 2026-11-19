import { test } from "node:test";
import assert from "node:assert/strict";
import { buildResendPayload, EMAIL_FROM, FOOTER_MARK } from "./payload";
import { orderStatusEmail, passwordResetEmail, restockEmail, transferInstructionsEmail } from "./templates";

const order = {
  code: "ZT-ABC123",
  customerName: "Ana",
  email: "ana@correo.test",
  status: "pagado" as const,
  shippingMethod: "domicilio" as const,
  subtotal: 10000,
  shippingCost: 0,
  discount: 0,
  total: 10000,
  items: [{ productName: "Cable", variantName: "1 m", unitPrice: 10000, quantity: 1 }],
};
const bank = { enabled: true, bankName: "Banco", accountName: "Titular", accountNumber: "123", accountType: "", instructions: "", holdHours: 24 };

const templates = {
  pagado: orderStatusEmail(order)!,
  enviado: orderStatusEmail({ ...order, status: "enviado", trackingNumber: "GT-1" })!,
  transferencia: transferInstructionsEmail(order, bank, null, "tienda@correo.test"),
  restock: restockEmail("ana@correo.test", "Cable", "1 m", "https://zorztech.com/productos/cable"),
  recuperar: passwordResetEmail("ana@correo.test", "Ana", "https://zorztech.com/recuperar?token=x"),
};

test("todos los correos salen de no-reply@zorztech.com", () => {
  assert.equal(EMAIL_FROM, "ZorzTech <no-reply@zorztech.com>");
  for (const [name, message] of Object.entries(templates)) {
    const payload = buildResendPayload(message, "tienda@correo.test");
    assert.match(payload.from, /<[^@>]+@zorztech\.com>$/, name);
  }
});

test("cada plantilla deja el lugar del pie y el pie lleva el correo de contacto", () => {
  for (const [name, message] of Object.entries(templates)) {
    assert.ok(message.html.includes(FOOTER_MARK), `${name} usa el layout con pie`);
    const payload = buildResendPayload(message, "tienda@correo.test");
    const footer = "Este correo es automático, no lo respondas. Si necesitas ayuda, escríbenos a tienda@correo.test.";
    assert.ok(payload.html.includes(footer), `${name}: pie en HTML`);
    assert.ok(!payload.html.includes(FOOTER_MARK), `${name}: no queda la marca`);
    assert.ok(payload.text.endsWith(footer), `${name}: pie en texto`);
  }
});

test("copia a la tienda en todos los correos al cliente, menos el de cambiar la contraseña", () => {
  for (const [name, message] of Object.entries(templates)) {
    const payload = buildResendPayload(message, "Tienda@Correo.test");
    if (name === "recuperar") assert.equal(payload.cc, undefined, "el enlace de la contraseña no se copia a nadie");
    else assert.deepEqual(payload.cc, ["Tienda@Correo.test"], name);
    assert.equal(payload.reply_to, "Tienda@Correo.test", "si el cliente responde, le llega a la tienda");
    assert.deepEqual(payload.to, ["ana@correo.test"]);
  }
});

test("sin correo de contacto válido: pie corto, sin copia ni respuesta", () => {
  for (const contact of [null, "", "[Correo de contacto]"]) {
    const payload = buildResendPayload(templates.pagado, contact);
    assert.equal(payload.cc, undefined);
    assert.equal(payload.reply_to, undefined);
    assert.ok(payload.text.endsWith("Este correo es automático, no lo respondas."));
  }
});

test("si el cliente es la propia tienda no se manda copia duplicada; el pie se escapa en HTML", () => {
  const self = buildResendPayload({ ...templates.pagado, to: "tienda@correo.test" }, "TIENDA@correo.test");
  assert.equal(self.cc, undefined);
  const odd = buildResendPayload(templates.pagado, "a&b@correo.test");
  assert.ok(odd.html.includes("a&amp;b@correo.test"));
});

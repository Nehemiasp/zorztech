import { test } from "node:test";
import assert from "node:assert/strict";
import { allowedTransitions, canTransition, timelineIndex, timelineSteps } from "./status";

test("el camino normal del pedido es válido", () => {
  const path = ["pendiente_pago", "pagado", "en_preparacion", "enviado", "entregado"] as const;
  for (let i = 0; i < path.length - 1; i++) assert.ok(canTransition(path[i], path[i + 1]), `${path[i]} → ${path[i + 1]}`);
});

test("recogida en tienda pasa por listo_para_recoger", () => {
  assert.ok(canTransition("en_preparacion", "listo_para_recoger"));
  assert.ok(canTransition("listo_para_recoger", "entregado"));
  assert.ok(!canTransition("listo_para_recoger", "enviado"));
});

test("un pago fallido puede reintentarse o expirar", () => {
  assert.ok(canTransition("pendiente_pago", "pago_fallido"));
  assert.ok(canTransition("pago_fallido", "pagado"));
  assert.ok(canTransition("pago_fallido", "expirado"));
});

test("solo se cancela antes de enviar y solo se reembolsa lo cancelado", () => {
  assert.ok(canTransition("pagado", "cancelado"));
  assert.ok(canTransition("en_preparacion", "cancelado"));
  assert.ok(!canTransition("enviado", "cancelado"));
  assert.ok(canTransition("cancelado", "reembolsado"));
  assert.ok(!canTransition("pagado", "reembolsado"));
});

test("los estados finales no tienen salida", () => {
  assert.deepEqual(allowedTransitions("entregado"), []);
  assert.deepEqual(allowedTransitions("reembolsado"), []);
});

test("no se retrocede", () => {
  assert.ok(!canTransition("pagado", "pendiente_pago"));
  assert.ok(!canTransition("entregado", "enviado"));
});

test("la línea de tiempo cambia según la entrega", () => {
  assert.equal(timelineSteps("domicilio")[2].status, "enviado");
  assert.equal(timelineSteps("recogida")[2].status, "listo_para_recoger");
  assert.equal(timelineIndex("en_preparacion"), 1);
  assert.equal(timelineIndex("listo_para_recoger"), 2);
  assert.equal(timelineIndex("cancelado"), -1);
});

test("un pedido expirado con pago tardío se puede cancelar para reembolsarlo", () => {
  assert.ok(canTransition("expirado", "cancelado"));
  assert.ok(canTransition("cancelado", "reembolsado"));
  assert.ok(!canTransition("expirado", "enviado"));
});

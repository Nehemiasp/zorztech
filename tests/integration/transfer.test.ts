// Integración del pago por transferencia: pedido apartado, correo, confirmación a mano y vencimiento.
// Crea sus propios datos y los borra al terminar. Ejecutar con: npm run test:integration
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { db } from "../../lib/db";
import type { CheckoutInput } from "../../lib/checkout/schema";
import { createOrderFromCart } from "../../lib/orders/create";
import { changeOrderStatus } from "../../lib/orders/admin";
import { expireStaleReservations } from "../../lib/orders/expiry";
import { addProof, countProofs, MAX_PROOFS, readProofImage } from "../../lib/orders/proofs";

// PNG de 1 × 1 píxel.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const png = (name = "comprobante.png") => new File([PNG], name, { type: "image/png" });

const run = Math.random().toString(36).slice(2, 8);
const PRICE = 50000; // Q 500.00: con envío gratis
let variantId = "";
let productId = "";
let adminId = "";
let previousTransfer: unknown = null;
let previousShipping: unknown = null;
const orders: string[] = [];
const carts: string[] = [];

const bank = { enabled: true, bankName: "Banco de prueba", accountName: "ZorzTech de prueba", accountNumber: "0123456789", accountType: "Monetaria", instructions: "", holdHours: 24 };
const putTransfer = (value: object) => db.storeSetting.upsert({ where: { key: "transferencia" }, update: { value }, create: { key: "transferencia", value } });
const stock = () => db.productVariant.findUniqueOrThrow({ where: { id: variantId }, select: { stock: true, reservedStock: true } });

async function cart(quantity = 1) {
  const c = await db.cart.create({ data: { sessionId: `tr-${run}-${Math.random().toString(36).slice(2)}` } });
  carts.push(c.id);
  await db.cartItem.create({ data: { cartId: c.id, variantId, quantity, priceAtAdd: PRICE } });
  return c.id;
}

const input = (over: Partial<CheckoutInput> = {}): CheckoutInput => ({
  contact: { name: "Cliente de prueba", email: `tr-${run}@correo.test`, phone: "55551234" },
  delivery: { method: "domicilio", nombre: "Ana", telefono: "55551234", departamento: "Petén", municipio: "Flores", direccion: "Zona 1, 5a calle 3-20" },
  billing: { taxId: "CF", taxName: "Consumidor final" },
  paymentMethod: "transferencia",
  acceptTerms: true,
  expectedTotal: PRICE,
  idempotencyKey: crypto.randomUUID(),
  ...over,
});

before(async () => {
  const category = await db.category.findFirstOrThrow({ where: { parentId: null } });
  const product = await db.product.create({
    data: { name: `Producto transferencia ${run}`, slug: `transferencia-${run}`, categoryId: category.id, isSample: true, variants: { create: { sku: `TR-${run}`, name: "Única", price: PRICE, stock: 10 } } },
    include: { variants: true },
  });
  productId = product.id;
  variantId = product.variants[0].id;
  adminId = (await db.user.create({ data: { email: `admin-tr-${run}@correo.test`, name: "Admin de prueba", role: "admin" } })).id;
  previousTransfer = (await db.storeSetting.findUnique({ where: { key: "transferencia" } }))?.value ?? null;
  previousShipping = (await db.storeSetting.findUnique({ where: { key: "envio" } }))?.value ?? null;
  await putTransfer(bank);
  const envio = { flatRate: 5500, freeFrom: 40000, deliveryTime: "" };
  await db.storeSetting.upsert({ where: { key: "envio" }, update: { value: envio }, create: { key: "envio", value: envio } });
});

after(async () => {
  await db.order.deleteMany({ where: { code: { in: orders } } });
  await db.cart.deleteMany({ where: { id: { in: carts } } });
  await db.product.delete({ where: { id: productId } });
  await db.user.delete({ where: { id: adminId } });
  if (previousTransfer === null) await db.storeSetting.deleteMany({ where: { key: "transferencia" } });
  else await db.storeSetting.update({ where: { key: "transferencia" }, data: { value: previousTransfer as object } });
  if (previousShipping === null) await db.storeSetting.deleteMany({ where: { key: "envio" } });
  else await db.storeSetting.update({ where: { key: "envio" }, data: { value: previousShipping as object } });
  await db.$disconnect();
});

describe("pago por transferencia", () => {
  test("aparta el pedido por el tiempo de la transferencia, registra el pago pendiente y vacía el carrito", async () => {
    await db.productVariant.update({ where: { id: variantId }, data: { stock: 10, reservedStock: 0 } });
    const cartId = await cart(1);
    const result = await createOrderFromCart(input(), null, cartId);
    assert.ok(result.ok, result.ok ? "" : result.message);
    orders.push(result.code);
    assert.deepEqual(result.payment, { kind: "transfer" });

    const order = await db.order.findUniqueOrThrow({ where: { code: result.code }, include: { payments: true } });
    assert.equal(order.status, "pendiente_pago");
    assert.equal(order.total, PRICE, "Q 500 supera Q 400: envío gratis");
    assert.equal(order.payments.length, 1);
    assert.equal(order.payments[0].provider, "transferencia");
    assert.equal(order.payments[0].status, "pending");
    assert.equal(order.payments[0].amount, PRICE);
    const hours = ((order.reservationExpiresAt?.getTime() ?? 0) - Date.now()) / 3_600_000;
    assert.ok(hours > 23 && hours <= 24, `el pedido se aparta unas 24 horas, no ${hours.toFixed(1)}`);
    assert.deepEqual(await stock(), { stock: 10, reservedStock: 1 });
    assert.equal(await db.cartItem.count({ where: { cartId } }), 0, "el carrito queda vacío");
  });

  test("repetir la misma petición devuelve el mismo pedido sin duplicar el pago", async () => {
    await db.productVariant.update({ where: { id: variantId }, data: { stock: 10, reservedStock: 0 } });
    const key = crypto.randomUUID();
    const first = await createOrderFromCart(input({ idempotencyKey: key }), null, await cart(1));
    assert.ok(first.ok);
    orders.push(first.code);
    const again = await createOrderFromCart(input({ idempotencyKey: key }), null, await cart(1));
    assert.ok(again.ok);
    assert.equal(again.code, first.code);
    assert.deepEqual(again.payment, { kind: "transfer" });
    const order = await db.order.findUniqueOrThrow({ where: { code: first.code }, include: { payments: true } });
    assert.equal(order.payments.length, 1);
    assert.deepEqual(await stock(), { stock: 10, reservedStock: 1 });
  });

  test("confirmarla a mano deja el pedido pagado, descuenta el stock y aprueba el pago", async () => {
    await db.productVariant.update({ where: { id: variantId }, data: { stock: 10, reservedStock: 0 } });
    const result = await createOrderFromCart(input({ expectedTotal: PRICE * 2 }), null, await cart(2));
    assert.ok(result.ok, result.ok ? "" : result.message);
    orders.push(result.code);

    const paid = await changeOrderStatus({ code: result.code, to: "pagado", actorId: adminId });
    assert.ok(paid.ok, paid.message);
    const order = await db.order.findUniqueOrThrow({ where: { code: result.code }, include: { payments: true } });
    assert.equal(order.status, "pagado");
    assert.equal(order.paymentStatus, "approved");
    assert.equal(order.payments[0].status, "approved");
    assert.ok(order.paidAt);
    assert.deepEqual(await stock(), { stock: 8, reservedStock: 0 });
  });

  test("si la transferencia llega después de vencer, aún se puede confirmar mientras haya stock", async () => {
    await db.productVariant.update({ where: { id: variantId }, data: { stock: 10, reservedStock: 0 } });
    const result = await createOrderFromCart(input(), null, await cart(1));
    assert.ok(result.ok);
    orders.push(result.code);
    await db.order.update({ where: { code: result.code }, data: { reservationExpiresAt: new Date(Date.now() - 60_000) } });
    assert.equal(await expireStaleReservations(), 1);
    assert.equal((await db.order.findUniqueOrThrow({ where: { code: result.code } })).status, "expirado");
    assert.deepEqual(await stock(), { stock: 10, reservedStock: 0 });

    const paid = await changeOrderStatus({ code: result.code, to: "pagado", actorId: adminId });
    assert.ok(paid.ok, paid.message);
    assert.deepEqual(await stock(), { stock: 9, reservedStock: 0 });
  });

  test("sin los datos de la cuenta, o desactivada, la transferencia no se ofrece", async () => {
    await putTransfer({ ...bank, enabled: false });
    const off = await createOrderFromCart(input(), null, await cart(1));
    assert.ok(!off.ok);
    assert.equal(off.error, "pago");

    await putTransfer({ ...bank, accountNumber: "" });
    const incomplete = await createOrderFromCart(input(), null, await cart(1));
    assert.ok(!incomplete.ok);

    await putTransfer(bank);
  });

  describe("comprobantes", () => {
    async function pending() {
      await db.productVariant.update({ where: { id: variantId }, data: { stock: 10, reservedStock: 0 } });
      const result = await createOrderFromCart(input(), null, await cart(1));
      assert.ok(result.ok, result.ok ? "" : result.message);
      orders.push(result.code);
      return result.code;
    }

    test("se guarda, se cuenta y se puede leer de vuelta", async () => {
      const code = await pending();
      const added = await addProof(code, png());
      assert.deepEqual(added, { ok: true, count: 1 });
      assert.equal(await countProofs(code), 1);
      const image = await readProofImage(code, 0);
      assert.ok(image);
      assert.equal(image.type, "image/png");
      assert.deepEqual(image.data, PNG);
      assert.equal(await readProofImage(code, 1), null);
      const events = await db.orderEvent.findMany({ where: { order: { code }, type: "comprobante" } });
      assert.equal(events.length, 1);
    });

    test("el pago conserva su registro de transferencia al guardar comprobantes", async () => {
      const code = await pending();
      await addProof(code, png());
      const payment = await db.payment.findFirstOrThrow({ where: { order: { code } } });
      assert.equal((payment.rawResponse as { checkout: { kind: string } }).checkout.kind, "transfer");
    });

    test("rechaza lo que no es una imagen, aunque diga serlo", async () => {
      const code = await pending();
      const fake = await addProof(code, new File([Buffer.from("%PDF-1.4 no soy una imagen")], "x.png", { type: "image/png" }));
      assert.ok(!fake.ok);
      assert.equal(await countProofs(code), 0);
    });

    test("rechaza archivos vacíos y muy pesados", async () => {
      const code = await pending();
      assert.ok(!(await addProof(code, new File([], "vacio.png", { type: "image/png" }))).ok);
      const big = new File([Buffer.concat([PNG, Buffer.alloc(3 * 1024 * 1024)])], "grande.png", { type: "image/png" });
      const result = await addProof(code, big);
      assert.ok(!result.ok && /3 MB/.test(result.message));
    });

    test(`no admite más de ${MAX_PROOFS}`, async () => {
      const code = await pending();
      for (let i = 0; i < MAX_PROOFS; i++) assert.ok((await addProof(code, png())).ok);
      const extra = await addProof(code, png());
      assert.ok(!extra.ok);
      assert.equal(await countProofs(code), MAX_PROOFS);
    });

    test("un pedido pagado ya no recibe comprobantes", async () => {
      const code = await pending();
      assert.ok((await changeOrderStatus({ code, to: "pagado", actorId: adminId })).ok);
      const late = await addProof(code, png());
      assert.ok(!late.ok);
    });

    test("un pedido que no es de transferencia no los acepta", async () => {
      await db.productVariant.update({ where: { id: variantId }, data: { stock: 10, reservedStock: 0 } });
      const result = await createOrderFromCart(input({ paymentMethod: "simulado" }), null, await cart(1));
      assert.ok(result.ok);
      orders.push(result.code);
      const proof = await addProof(result.code, png());
      assert.ok(!proof.ok);
    });
  });
});

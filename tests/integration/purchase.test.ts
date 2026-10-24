// Integración de la compra contra la base de datos de desarrollo.
// Crea sus propios productos, carritos y pedidos y los borra al terminar; no toca los datos del seed.
// Ejecutar con: npm run test:integration
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { db } from "../../lib/db";
import { createOrderFromCart, retryPayment } from "../../lib/orders/create";
import { expireStaleReservations } from "../../lib/orders/expiry";
import { applyPaymentResult } from "../../lib/orders/payment-result";
import { loadCartView } from "../../lib/cart/view";
import type { CheckoutInput } from "../../lib/checkout/schema";
import type { PaymentStatus } from "../../lib/generated/prisma/client";

const run = Math.random().toString(36).slice(2, 8);
const PRICE = 150000; // Q 1,500.00
let variantId = "";
let pickupId = "";
const createdOrders: string[] = [];
const createdCarts: string[] = [];
let productId = "";

const stock = async () => {
  const v = await db.productVariant.findUniqueOrThrow({ where: { id: variantId }, select: { stock: true, reservedStock: true } });
  return v;
};
const setStock = (stock: number) => db.productVariant.update({ where: { id: variantId }, data: { stock, reservedStock: 0 } });

async function cartWith(quantity: number) {
  const cart = await db.cart.create({ data: { sessionId: `test-${run}-${Math.random().toString(36).slice(2)}` } });
  createdCarts.push(cart.id);
  await db.cartItem.create({ data: { cartId: cart.id, variantId, quantity, priceAtAdd: PRICE } });
  return cart.id;
}

const input = (over: Partial<CheckoutInput> = {}): CheckoutInput => ({
  contact: { name: "Cliente de prueba", email: `prueba-${run}@correo.test`, phone: "55551234" },
  delivery: { method: "recogida", pickupLocationId: pickupId },
  billing: { taxId: "CF", taxName: "Consumidor final" },
  paymentMethod: "simulado",
  acceptTerms: true,
  expectedTotal: PRICE,
  idempotencyKey: crypto.randomUUID(),
  ...over,
});

async function placeOrder(quantity = 1, over: Partial<CheckoutInput> = {}) {
  const cartId = await cartWith(quantity);
  const result = await createOrderFromCart(input({ expectedTotal: PRICE * quantity, ...over }), null, cartId);
  assert.ok(result.ok, result.ok ? "" : result.message);
  createdOrders.push(result.code);
  const order = await db.order.findUniqueOrThrow({ where: { code: result.code }, include: { payments: true, items: true } });
  return { cartId, order, payment: order.payments[0] };
}

const webhook = (providerRef: string, status: PaymentStatus, amount?: number) =>
  applyPaymentResult({ provider: "mock", providerRef, status, raw: { providerRef, status, amount }, amount });

before(async () => {
  const category = await db.category.findFirstOrThrow({ where: { parentId: null } });
  const pickup = await db.pickupLocation.findFirstOrThrow({ where: { isActive: true } });
  pickupId = pickup.id;
  const product = await db.product.create({
    data: {
      name: `Producto de prueba ${run}`,
      slug: `prueba-${run}`,
      categoryId: category.id,
      isSample: true,
      variants: { create: { sku: `TEST-${run}`, name: "Única", price: PRICE, stock: 10 } },
    },
    include: { variants: true },
  });
  productId = product.id;
  variantId = product.variants[0].id;
});

after(async () => {
  await db.order.deleteMany({ where: { code: { in: createdOrders } } });
  await db.cart.deleteMany({ where: { id: { in: createdCarts } } });
  await db.product.delete({ where: { id: productId } });
  await db.$disconnect();
});

describe("compra con pago aprobado", () => {
  test("crea el pedido con total del servidor, aparta el stock y deja el pago pendiente", async () => {
    await setStock(10);
    const { order, payment } = await placeOrder(2);
    assert.equal(order.status, "pendiente_pago");
    assert.equal(order.subtotal, PRICE * 2);
    assert.equal(order.total, PRICE * 2);
    assert.equal(order.items[0].unitPrice, PRICE);
    assert.ok(order.reservationExpiresAt && order.reservationExpiresAt > new Date());
    assert.equal(payment.status, "pending");
    assert.equal(payment.amount, order.total);
    assert.deepEqual(await stock(), { stock: 10, reservedStock: 2 });
  });

  test("al aprobarse: pasa a pagado, el stock reservado se descuenta y el carrito se vacía", async () => {
    await setStock(10);
    const { order, payment, cartId } = await placeOrder(2);
    const outcome = await webhook(payment.providerRef, "approved", order.total);
    assert.deepEqual(outcome, { kind: "aplicado", orderCode: order.code, orderStatus: "pagado" });
    const paid = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(paid.status, "pagado");
    assert.equal(paid.paymentStatus, "approved");
    assert.ok(paid.paidAt);
    assert.deepEqual(await stock(), { stock: 8, reservedStock: 0 });
    assert.equal((await loadCartView(cartId)).lines.length, 0);
    const events = await db.orderEvent.findMany({ where: { orderId: order.id }, orderBy: { createdAt: "asc" } });
    assert.deepEqual(events.map((e) => e.toStatus), ["pendiente_pago", "pagado"]);
  });

  test("un webhook duplicado no descuenta stock ni cambia nada", async () => {
    await setStock(10);
    const { order, payment } = await placeOrder(1);
    await webhook(payment.providerRef, "approved", order.total);
    const again = await webhook(payment.providerRef, "approved", order.total);
    assert.equal(again.kind, "sin_cambios");
    assert.deepEqual(await stock(), { stock: 9, reservedStock: 0 });
    assert.equal(await db.orderEvent.count({ where: { orderId: order.id, toStatus: "pagado" } }), 1);
  });

  test("un pago aprobado nunca se degrada por un aviso posterior de rechazo", async () => {
    await setStock(10);
    const { order, payment } = await placeOrder(1);
    await webhook(payment.providerRef, "approved", order.total);
    const late = await webhook(payment.providerRef, "declined");
    assert.equal(late.kind, "sin_cambios");
    assert.equal((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status, "pagado");
  });

  test("repetir la creación con la misma clave devuelve el mismo pedido y no aparta stock dos veces", async () => {
    await setStock(10);
    const cartId = await cartWith(1);
    const same = input();
    const a = await createOrderFromCart(same, null, cartId);
    const b = await createOrderFromCart(same, null, cartId);
    assert.ok(a.ok && b.ok);
    createdOrders.push(a.code);
    assert.equal(a.code, b.code);
    assert.deepEqual(await stock(), { stock: 10, reservedStock: 1 });
  });
});

describe("pago rechazado, pendiente y reintento", () => {
  test("rechazado: el pedido pasa a pago_fallido y conserva su reserva", async () => {
    await setStock(10);
    const { order, payment } = await placeOrder(1);
    await webhook(payment.providerRef, "declined", order.total);
    const failed = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(failed.status, "pago_fallido");
    assert.deepEqual(await stock(), { stock: 10, reservedStock: 1 });
  });

  test("reintento: abre un pago nuevo y, aprobado, el pedido queda pagado", async () => {
    await setStock(10);
    const { order, payment } = await placeOrder(1);
    await webhook(payment.providerRef, "declined", order.total);
    const retry = await retryPayment(order.code);
    assert.ok(retry.ok);
    const payments = await db.payment.findMany({ where: { orderId: order.id }, orderBy: { createdAt: "asc" } });
    assert.equal(payments.length, 2);
    assert.notEqual(payments[0].providerRef, payments[1].providerRef);
    await webhook(payments[1].providerRef, "approved", order.total);
    assert.equal((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status, "pagado");
    assert.deepEqual(await stock(), { stock: 9, reservedStock: 0 });
  });

  test("pendiente: el pedido sigue esperando y el stock sigue apartado; luego se aprueba", async () => {
    await setStock(10);
    const { order, payment } = await placeOrder(1);
    await webhook(payment.providerRef, "pending");
    const waiting = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(waiting.status, "pendiente_pago");
    assert.equal(waiting.paymentStatus, "pending");
    assert.deepEqual(await stock(), { stock: 10, reservedStock: 1 });
    await webhook(payment.providerRef, "approved", order.total);
    assert.equal((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status, "pagado");
  });

  test("un monto distinto al del pedido no lo marca como pagado y deja una alerta", async () => {
    await setStock(10);
    const { order, payment } = await placeOrder(1);
    await webhook(payment.providerRef, "approved", order.total - 100);
    const after = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.notEqual(after.status, "pagado");
    assert.equal((await db.payment.findUniqueOrThrow({ where: { id: payment.id } })).status, "error");
    assert.equal(await db.orderEvent.count({ where: { orderId: order.id, type: "alerta" } }), 1);
    assert.deepEqual(await stock(), { stock: 10, reservedStock: 1 });
  });

  test("un aviso para un pago desconocido se rechaza sin tocar nada", async () => {
    assert.equal((await webhook("MOCK-no-existe", "approved")).kind, "desconocido");
  });
});

describe("expiración y pago tardío", () => {
  test("una reserva vencida expira el pedido y libera el stock", async () => {
    await setStock(10);
    const { order } = await placeOrder(3);
    assert.deepEqual(await stock(), { stock: 10, reservedStock: 3 });
    await db.order.update({ where: { id: order.id }, data: { reservationExpiresAt: new Date(Date.now() - 1000) } });
    const expired = await expireStaleReservations();
    assert.ok(expired >= 1);
    assert.equal((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status, "expirado");
    assert.deepEqual(await stock(), { stock: 10, reservedStock: 0 });
    assert.equal(await expireStaleReservations(), 0, "una segunda pasada no vuelve a liberar");
    assert.deepEqual(await stock(), { stock: 10, reservedStock: 0 });
  });

  test("un pago aprobado tarde revive el pedido si todavía hay stock", async () => {
    await setStock(10);
    const { order, payment } = await placeOrder(2);
    await db.order.update({ where: { id: order.id }, data: { reservationExpiresAt: new Date(Date.now() - 1000) } });
    await expireStaleReservations();
    const outcome = await webhook(payment.providerRef, "approved", order.total);
    assert.equal(outcome.kind === "aplicado" && outcome.orderStatus, "pagado");
    assert.deepEqual(await stock(), { stock: 8, reservedStock: 0 });
  });

  test("un pago aprobado tarde sin stock no vende lo que no hay: queda en alerta", async () => {
    await setStock(10);
    const { order, payment } = await placeOrder(2);
    await db.order.update({ where: { id: order.id }, data: { reservationExpiresAt: new Date(Date.now() - 1000) } });
    await expireStaleReservations();
    await setStock(1); // alguien más compró mientras tanto
    await webhook(payment.providerRef, "approved", order.total);
    const after = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(after.status, "expirado");
    assert.equal(after.paymentStatus, "approved");
    assert.equal(await db.orderEvent.count({ where: { orderId: order.id, type: "alerta" } }), 1);
    assert.deepEqual(await stock(), { stock: 1, reservedStock: 0 });
  });
});

describe("inventario y precios", () => {
  test("dos compradores por la última unidad: solo uno la consigue", async () => {
    await setStock(1);
    const [cartA, cartB] = [await cartWith(1), await cartWith(1)];
    const results = await Promise.all([
      createOrderFromCart(input({ expectedTotal: PRICE }), null, cartA),
      createOrderFromCart(input({ expectedTotal: PRICE }), null, cartB),
    ]);
    for (const r of results) if (r.ok) createdOrders.push(r.code);
    assert.equal(results.filter((r) => r.ok).length, 1);
    const loser = results.find((r) => !r.ok);
    assert.ok(loser && !loser.ok && loser.error === "sin_stock");
    assert.deepEqual(await stock(), { stock: 1, reservedStock: 1 });
  });

  test("el carrito pide más de lo que hay: no se crea el pedido", async () => {
    await setStock(2);
    const cartId = await cartWith(3);
    const result = await createOrderFromCart(input({ expectedTotal: PRICE * 3 }), null, cartId);
    assert.ok(!result.ok);
    assert.deepEqual(await stock(), { stock: 2, reservedStock: 0 });
  });

  test("el precio sale de la base: si cambió, el total esperado no coincide y no se crea el pedido", async () => {
    await setStock(10);
    const cartId = await cartWith(1);
    await db.productVariant.update({ where: { id: variantId }, data: { price: PRICE + 5000 } });
    try {
      const result = await createOrderFromCart(input({ expectedTotal: PRICE }), null, cartId);
      assert.ok(!result.ok && result.error === "total_cambio");
      assert.deepEqual(await stock(), { stock: 10, reservedStock: 0 });
      const view = await loadCartView(cartId);
      assert.ok(view.priceChanged);
      assert.equal(view.lines[0].unitPrice, PRICE + 5000);
    } finally {
      await db.productVariant.update({ where: { id: variantId }, data: { price: PRICE } });
    }
  });

  test("un nuevo intento de compra del mismo carrito reemplaza al pedido anterior sin pagar", async () => {
    await setStock(10);
    const cartId = await cartWith(1);
    const first = await createOrderFromCart(input(), null, cartId);
    const second = await createOrderFromCart(input(), null, cartId);
    assert.ok(first.ok && second.ok);
    createdOrders.push(first.code, second.code);
    assert.equal((await db.order.findUniqueOrThrow({ where: { code: first.code } })).status, "cancelado");
    assert.equal((await db.order.findUniqueOrThrow({ where: { code: second.code } })).status, "pendiente_pago");
    assert.deepEqual(await stock(), { stock: 10, reservedStock: 1 });
  });

  test("el envío a domicilio suma la tarifa del departamento", async () => {
    await setStock(10);
    const rate = await db.shippingRate.findUniqueOrThrow({ where: { departamento: "Guatemala" } });
    const cartId = await cartWith(1);
    const result = await createOrderFromCart(
      input({
        expectedTotal: PRICE + rate.price,
        delivery: { method: "domicilio", nombre: "Ana", telefono: "55551234", departamento: "Guatemala", municipio: "Mixco", direccion: "Zona 1, 5a calle 3-20" },
      }),
      null,
      cartId,
    );
    assert.ok(result.ok);
    createdOrders.push(result.code);
    const order = await db.order.findUniqueOrThrow({ where: { code: result.code } });
    assert.equal(order.shippingCost, rate.price);
    assert.equal(order.total, PRICE + rate.price);
  });
});

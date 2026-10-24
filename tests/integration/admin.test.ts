// Integración del panel: cambios de estado, reembolsos, cupones y guardado de productos.
// Crea sus propios datos y los borra al terminar. Ejecutar con: npm run test:integration
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { couponFormSchema, saveCoupon } from "../../lib/admin/coupons";
import { productSchema } from "../../lib/admin/product-schema";
import { saveProduct } from "../../lib/admin/products";
import { db } from "../../lib/db";
import type { CheckoutInput } from "../../lib/checkout/schema";
import { createOrderFromCart } from "../../lib/orders/create";
import { changeOrderStatus } from "../../lib/orders/admin";
import { expireStaleReservations } from "../../lib/orders/expiry";
import { applyPaymentResult } from "../../lib/orders/payment-result";

const run = Math.random().toString(36).slice(2, 8);
const PRICE = 100000;
let variantId = "";
let productId = "";
let categoryId = "";
let pickupId = "";
let adminId = "";
const orders: string[] = [];
const carts: string[] = [];
const coupons: string[] = [];

const stock = () => db.productVariant.findUniqueOrThrow({ where: { id: variantId }, select: { stock: true, reservedStock: true } });
const setStock = (n: number) => db.productVariant.update({ where: { id: variantId }, data: { stock: n, reservedStock: 0 } });

async function buy(quantity = 1, couponCode?: string) {
  const cart = await db.cart.create({ data: { sessionId: `adm-${run}-${Math.random().toString(36).slice(2)}`, couponCode } });
  carts.push(cart.id);
  await db.cartItem.create({ data: { cartId: cart.id, variantId, quantity, priceAtAdd: PRICE } });
  const input = (expected: number): CheckoutInput => ({
    contact: { name: "Cliente de prueba", email: `adm-${run}@correo.test`, phone: "55551234" },
    delivery: { method: "recogida", pickupLocationId: pickupId },
    billing: { taxId: "CF", taxName: "Consumidor final" },
    paymentMethod: "simulado",
    acceptTerms: true,
    expectedTotal: expected,
    idempotencyKey: crypto.randomUUID(),
  });
  return { cartId: cart.id, input };
}

async function paidOrder(quantity = 1) {
  const { cartId, input } = await buy(quantity);
  const result = await createOrderFromCart(input(PRICE * quantity), null, cartId);
  assert.ok(result.ok);
  orders.push(result.code);
  const order = await db.order.findUniqueOrThrow({ where: { code: result.code }, include: { payments: true } });
  await applyPaymentResult({ provider: "mock", providerRef: order.payments[0].providerRef, status: "approved", raw: {}, amount: order.total });
  return db.order.findUniqueOrThrow({ where: { id: order.id }, include: { payments: true } });
}

before(async () => {
  const category = await db.category.findFirstOrThrow({ where: { parentId: null } });
  categoryId = category.id;
  pickupId = (await db.pickupLocation.findFirstOrThrow({ where: { isActive: true } })).id;
  adminId = (await db.user.findFirstOrThrow({ where: { role: "admin" } })).id;
  const product = await db.product.create({
    data: { name: `Producto admin ${run}`, slug: `admin-${run}`, categoryId, isSample: true, variants: { create: { sku: `ADM-${run}`, name: "Única", price: PRICE, stock: 10 } } },
    include: { variants: true },
  });
  productId = product.id;
  variantId = product.variants[0].id;
});

after(async () => {
  // Se borran los pedidos por código y también cualquiera que haya quedado con productos de estas pruebas.
  await db.order.deleteMany({ where: { OR: [{ code: { in: orders } }, { items: { some: { variant: { product: { slug: { startsWith: `admin-${run}` } } } } } }] } });
  await db.cart.deleteMany({ where: { id: { in: carts } } });
  await db.coupon.deleteMany({ where: { id: { in: coupons } } });
  await db.product.deleteMany({ where: { slug: { startsWith: `admin-${run}` } } });
  await db.product.deleteMany({ where: { name: { startsWith: `Guardado ${run}` } } });
  await db.$disconnect();
});

describe("estados del pedido desde el panel", () => {
  test("del pago a la entrega, paso a paso, sin saltos", async () => {
    await setStock(10);
    const order = await paidOrder();
    assert.deepEqual(await stock(), { stock: 9, reservedStock: 0 });

    const skip = await changeOrderStatus({ code: order.code, to: "entregado", actorId: adminId });
    assert.ok(!skip.ok && /no puede pasar/.test(skip.message));
    for (const to of ["en_preparacion", "enviado", "entregado"] as const) {
      const r = await changeOrderStatus({ code: order.code, to, actorId: adminId });
      assert.ok(r.ok, r.message);
    }
    const events = await db.orderEvent.findMany({ where: { orderId: order.id, type: "estado" }, orderBy: { createdAt: "asc" } });
    assert.deepEqual(events.map((e) => e.toStatus), ["pagado", "en_preparacion", "enviado", "entregado"]);
    assert.equal(events.at(-1)?.actorId, adminId, "el cambio queda a nombre de quien lo hizo");
    assert.deepEqual(await stock(), { stock: 9, reservedStock: 0 }, "entregar no toca el inventario");
  });

  test("cancelar un pedido pagado devuelve las unidades y reembolsar usa al proveedor", async () => {
    await setStock(10);
    const order = await paidOrder(2);
    assert.deepEqual(await stock(), { stock: 8, reservedStock: 0 });

    const early = await changeOrderStatus({ code: order.code, to: "reembolsado", actorId: adminId });
    assert.ok(!early.ok, "no se reembolsa sin cancelar antes");
    assert.ok((await changeOrderStatus({ code: order.code, to: "cancelado", actorId: adminId, note: "Cliente se arrepintió" })).ok);
    assert.deepEqual(await stock(), { stock: 10, reservedStock: 0 });
    const refund = await changeOrderStatus({ code: order.code, to: "reembolsado", actorId: adminId });
    assert.ok(refund.ok);
    const done = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { payments: true } });
    assert.equal(done.status, "reembolsado");
    assert.equal(done.paymentStatus, "refunded");
    assert.equal(done.payments[0].status, "refunded");
    assert.deepEqual(await stock(), { stock: 10, reservedStock: 0 }, "reembolsar no vuelve a sumar unidades");
    assert.ok(!(await changeOrderStatus({ code: order.code, to: "pagado", actorId: adminId })).ok, "un estado final no se reabre");
  });

  test("cancelar un pedido sin pagar libera su reserva", async () => {
    await setStock(10);
    const { cartId, input } = await buy(3);
    const result = await createOrderFromCart(input(PRICE * 3), null, cartId);
    assert.ok(result.ok);
    orders.push(result.code);
    assert.deepEqual(await stock(), { stock: 10, reservedStock: 3 });
    assert.ok((await changeOrderStatus({ code: result.code, to: "cancelado", actorId: adminId })).ok);
    assert.deepEqual(await stock(), { stock: 10, reservedStock: 0 });
  });

  test("marcar como pagado a mano (depósito) cobra el stock reservado", async () => {
    await setStock(10);
    const { cartId, input } = await buy(2);
    const result = await createOrderFromCart(input(PRICE * 2), null, cartId);
    assert.ok(result.ok);
    orders.push(result.code);
    assert.ok((await changeOrderStatus({ code: result.code, to: "pagado", actorId: adminId, note: "Depósito confirmado" })).ok);
    assert.deepEqual(await stock(), { stock: 8, reservedStock: 0 });
    const order = await db.order.findUniqueOrThrow({ where: { code: result.code } });
    assert.equal(order.paymentStatus, "approved");
    assert.ok(order.paidAt);
  });

  test("un pago tardío sin stock se resuelve cancelando y reembolsando", async () => {
    await setStock(10);
    const { cartId, input } = await buy(2);
    const result = await createOrderFromCart(input(PRICE * 2), null, cartId);
    assert.ok(result.ok);
    orders.push(result.code);
    const order = await db.order.findUniqueOrThrow({ where: { code: result.code }, include: { payments: true } });
    await db.order.update({ where: { id: order.id }, data: { reservationExpiresAt: new Date(Date.now() - 1000) } });
    await expireStaleReservations();
    await setStock(0);
    await applyPaymentResult({ provider: "mock", providerRef: order.payments[0].providerRef, status: "approved", raw: {}, amount: order.total });
    assert.equal((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status, "expirado");
    assert.ok((await changeOrderStatus({ code: result.code, to: "cancelado", actorId: adminId })).ok);
    assert.ok((await changeOrderStatus({ code: result.code, to: "reembolsado", actorId: adminId })).ok);
    assert.deepEqual(await stock(), { stock: 0, reservedStock: 0 });
  });
});

describe("cupones", () => {
  const makeCoupon = async (over: Record<string, unknown> = {}) => {
    const parsed = couponFormSchema.parse({ code: `T${run}${Math.random().toString(36).slice(2, 6)}`.toUpperCase(), type: "porcentaje", value: "20", minSubtotal: "", startsAt: "", endsAt: "", usageLimit: "", isActive: true, ...over });
    const saved = await saveCoupon(parsed);
    assert.ok(saved.ok);
    coupons.push(saved.id);
    return { id: saved.id, code: parsed.code };
  };

  test("el descuento sale del servidor, queda en el pedido y cuenta un uso", async () => {
    await setStock(10);
    const coupon = await makeCoupon();
    const { cartId, input } = await buy(1, coupon.code);
    const bad = await createOrderFromCart(input(PRICE), null, cartId);
    assert.ok(!bad.ok && bad.error === "total_cambio", "el total sin descuento ya no coincide");
    const ok = await createOrderFromCart(input(PRICE - 20000), null, cartId);
    assert.ok(ok.ok);
    orders.push(ok.code);
    const order = await db.order.findUniqueOrThrow({ where: { code: ok.code } });
    assert.equal(order.discount, 20000);
    assert.equal(order.total, PRICE - 20000);
    assert.equal(order.couponId, coupon.id);
    assert.equal((await db.coupon.findUniqueOrThrow({ where: { id: coupon.id } })).usedCount, 1);
  });

  test("cancelar, expirar o reemplazar el pedido devuelve el uso del cupón", async () => {
    await setStock(10);
    const coupon = await makeCoupon();
    const { cartId, input } = await buy(1, coupon.code);
    const first = await createOrderFromCart(input(PRICE - 20000), null, cartId);
    assert.ok(first.ok);
    orders.push(first.code);
    assert.equal((await db.coupon.findUniqueOrThrow({ where: { id: coupon.id } })).usedCount, 1);
    assert.ok((await changeOrderStatus({ code: first.code, to: "cancelado", actorId: adminId })).ok);
    assert.equal((await db.coupon.findUniqueOrThrow({ where: { id: coupon.id } })).usedCount, 0);

    const second = await createOrderFromCart(input(PRICE - 20000), null, cartId);
    assert.ok(second.ok);
    orders.push(second.code);
    await db.order.update({ where: { code: second.code }, data: { reservationExpiresAt: new Date(Date.now() - 1000) } });
    await expireStaleReservations();
    assert.equal((await db.coupon.findUniqueOrThrow({ where: { id: coupon.id } })).usedCount, 0);
  });

  test("con límite de 1 uso, solo el primer pedido lo consigue", async () => {
    await setStock(10);
    const coupon = await makeCoupon({ usageLimit: "1" });
    const [a, b] = [await buy(1, coupon.code), await buy(1, coupon.code)];
    const results = await Promise.all([createOrderFromCart(a.input(PRICE - 20000), null, a.cartId), createOrderFromCart(b.input(PRICE - 20000), null, b.cartId)]);
    for (const r of results) if (r.ok) orders.push(r.code);
    assert.equal(results.filter((r) => r.ok).length, 1);
    const loser = results.find((r) => !r.ok);
    assert.ok(loser && !loser.ok && loser.error === "cupon");
    assert.equal((await db.coupon.findUniqueOrThrow({ where: { id: coupon.id } })).usedCount, 1);
  });

  test("un cupón vencido o desactivado se quita del carrito y el total que vio el cliente ya no coincide", async () => {
    await setStock(10);
    const expired = await makeCoupon({ startsAt: "2020-01-01", endsAt: "2020-01-02" });
    const off = await makeCoupon({ isActive: false });
    for (const c of [expired, off]) {
      const { cartId, input } = await buy(1, c.code);
      // El cliente había visto el total con descuento; el cupón ya no vale, así que no se cobra de más ni de menos.
      const r = await createOrderFromCart(input(PRICE - 20000), null, cartId);
      assert.ok(!r.ok && r.error === "total_cambio");
      assert.equal((await db.cart.findUniqueOrThrow({ where: { id: cartId } })).couponCode, null, "el cupón se quitó del carrito");
      assert.deepEqual(await stock(), { stock: 10, reservedStock: 0 });
    }
  });
});

describe("guardar productos", () => {
  const form = (over: Record<string, unknown> = {}) =>
    productSchema.parse({
      name: `Guardado ${run} ${Math.random().toString(36).slice(2, 5)}`,
      slug: "",
      brandId: null,
      categoryId,
      description: "Descripción de prueba",
      specs: [{ clave: "Peso", valor: "1 kg" }],
      isActive: true,
      isFeatured: false,
      isSample: true,
      variants: [{ sku: `G-${run}-${Math.random().toString(36).slice(2, 6)}`, name: "Negro", attributes: [{ clave: "Color", valor: "Negro" }], price: "150.00", compareAtPrice: "", stock: "5", lowStockThreshold: "2", isActive: true }],
      images: [],
      ...over,
    });

  test("crea el producto con slug único, atributos como clave y texto de búsqueda", async () => {
    const input = form();
    const first = await saveProduct(input);
    assert.ok(first.ok);
    const product = await db.product.findUniqueOrThrow({ where: { id: first.id }, include: { variants: true } });
    assert.match(product.slug, /^guardado-/);
    assert.deepEqual(product.variants[0].attributes, { color: "Negro" });
    assert.equal(product.variants[0].price, 15000);
    assert.ok(product.searchText.startsWith(input.name.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim()));
    const sameName = await saveProduct(form({ name: input.name, variants: [{ ...input.variants[0], sku: `G2-${run}` , price: "150.00", compareAtPrice: "", stock: "1", lowStockThreshold: "1", attributes: [{ clave: "Color", valor: "Rojo" }] }] }));
    assert.ok(sameName.ok);
    const other = await db.product.findUniqueOrThrow({ where: { id: sameName.id } });
    assert.notEqual(other.slug, product.slug, "el mismo nombre genera otro slug");
  });

  test("rechaza un SKU repetido en otro producto", async () => {
    const input = form();
    assert.ok((await saveProduct(input)).ok);
    const again = await saveProduct(form({ variants: [{ ...input.variants[0], price: "150.00", compareAtPrice: "", stock: "5", lowStockThreshold: "2" }] }));
    assert.ok(!again.ok && Object.keys(again.fields ?? {}).some((k) => k.endsWith(".sku")));
  });

  test("el stock no puede quedar por debajo de lo apartado en pedidos sin pagar", async () => {
    await setStock(10);
    const { cartId, input } = await buy(4);
    const order = await createOrderFromCart(input(PRICE * 4), null, cartId);
    assert.ok(order.ok);
    orders.push(order.code);
    const product = await db.product.findUniqueOrThrow({ where: { id: productId }, include: { variants: true } });
    const v = product.variants[0];
    const base = { id: product.id, name: product.name, slug: product.slug, categoryId, description: "", specs: [], isActive: true, isFeatured: false, isSample: true, brandId: null, images: [] };
    const low = await saveProduct(productSchema.parse({ ...base, variants: [{ id: v.id, sku: v.sku, name: v.name, attributes: [], price: "1000.00", stock: "3", lowStockThreshold: "3", isActive: true }] }));
    assert.ok(!low.ok && low.fields?.["variants.0.stock"]);
    const fine = await saveProduct(productSchema.parse({ ...base, variants: [{ id: v.id, sku: v.sku, name: v.name, attributes: [], price: "1000.00", stock: "4", lowStockThreshold: "3", isActive: true }] }));
    assert.ok(fine.ok);
  });

  test("una variante que ya se vendió se desactiva en lugar de borrarse", async () => {
    await setStock(10);
    const sold = await paidOrder(1);
    assert.ok(sold);
    const extra = await db.productVariant.create({ data: { productId, sku: `EXTRA-${run}`, name: "Extra", price: 5000, stock: 1 } });
    const product = await db.product.findUniqueOrThrow({ where: { id: productId }, include: { variants: true } });
    const keep = product.variants.find((v) => v.id !== variantId && v.id !== extra.id) ?? null;
    void keep;
    const base = { id: product.id, name: product.name, slug: product.slug, categoryId, description: "", specs: [], isActive: true, isFeatured: false, isSample: true, brandId: null, images: [] };
    // Se envía solo la variante "Extra": la vendida (variantId) desaparece del formulario.
    const result = await saveProduct(productSchema.parse({ ...base, variants: [{ id: extra.id, sku: extra.sku, name: extra.name, attributes: [], price: "50.00", stock: "1", lowStockThreshold: "1", isActive: true }] }));
    assert.ok(result.ok && result.notices.length === 1);
    assert.equal((await db.productVariant.findUniqueOrThrow({ where: { id: variantId } })).isActive, false);
    await db.productVariant.update({ where: { id: variantId }, data: { isActive: true } });
    await db.productVariant.delete({ where: { id: extra.id } });
  });

  test("al reponer stock se avisa una sola vez a quien lo esperaba", async () => {
    await db.productVariant.update({ where: { id: variantId }, data: { stock: 0, reservedStock: 0, isActive: true } });
    await db.stockAlert.create({ data: { variantId, email: `espera-${run}@correo.test` } });
    const product = await db.product.findUniqueOrThrow({ where: { id: productId }, include: { variants: true } });
    const v = product.variants.find((x) => x.id === variantId)!;
    const base = { id: product.id, name: product.name, slug: product.slug, categoryId, description: "", specs: [], isActive: true, isFeatured: false, isSample: true, brandId: null, images: [] };
    const payload = (stock: string) => productSchema.parse({ ...base, variants: product.variants.map((x) => ({ id: x.id, sku: x.sku, name: x.name, attributes: [], price: "1000.00", stock: x.id === v.id ? stock : String(x.stock), lowStockThreshold: "3", isActive: true })) });
    assert.ok((await saveProduct(payload("5"))).ok);
    const alert = await db.stockAlert.findFirstOrThrow({ where: { variantId } });
    assert.ok(alert.notifiedAt, "se marcó como avisado");
    const stamp = alert.notifiedAt.getTime();
    assert.ok((await saveProduct(payload("8"))).ok);
    assert.equal((await db.stockAlert.findFirstOrThrow({ where: { variantId } })).notifiedAt?.getTime(), stamp, "no se vuelve a avisar");
  });
});

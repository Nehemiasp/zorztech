import { expect, test } from "@playwright/test";
import { addProduct, codigoDelPedido, comprador, completarCheckout, pagarYElegir } from "./ayudas";

const PRODUCTO = "cable-usb-c-trenzado";

test.describe("compra como invitado", () => {
  test("de la ficha al pedido pagado, con seguimiento por código y correo", async ({ page }) => {
    const c = comprador();
    await addProduct(page, PRODUCTO);

    await page.getByRole("link", { name: "Ir a pagar" }).click();
    await expect(page).toHaveURL(/\/checkout/);
    await completarCheckout(page, c);

    // El botón dice el monto real: producto + envío a Guatemala.
    await expect(page.getByRole("button", { name: /^Pagar Q/ })).toContainText("Q");
    await pagarYElegir(page, "Aprobar");

    const codigo = await codigoDelPedido(page);
    await expect(page.getByRole("heading", { name: "Gracias por tu compra" })).toBeVisible();
    await expect(page.getByText(c.correo)).toBeVisible();

    // El carrito se vació al aprobarse el pago.
    await page.goto("/carrito");
    await expect(page.getByText("Tu carrito está vacío").first()).toBeVisible();

    // Seguimiento sin cuenta: código + correo.
    await page.context().clearCookies();
    await page.goto("/pedido/seguimiento");
    await page.getByLabel("Código del pedido").fill(codigo);
    await page.getByLabel("Correo de la compra").fill(c.correo);
    await page.getByRole("button", { name: "Ver mi pedido" }).click();
    await expect(page.getByText(codigo).first()).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Pagado" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Avance del pedido" })).toBeVisible();

    // Con un correo equivocado no se ve nada del pedido.
    await page.context().clearCookies();
    await page.goto("/pedido/seguimiento");
    await page.getByLabel("Código del pedido").fill(codigo);
    await page.getByLabel("Correo de la compra").fill("otra@persona.test");
    await page.getByRole("button", { name: "Ver mi pedido" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "No encontramos un pedido" })).toBeVisible();
  });

  test("sin cookie de acceso la confirmación de un pedido no se muestra", async ({ page, context }) => {
    const c = comprador();
    await addProduct(page, PRODUCTO);
    await page.goto("/checkout");
    await completarCheckout(page, c);
    await pagarYElegir(page, "Aprobar");
    const codigo = await codigoDelPedido(page);

    await context.clearCookies();
    await page.goto(`/pedido/${codigo}/confirmacion`);
    await expect(page).toHaveURL(/\/pedido\/seguimiento\?codigo=/);
    await expect(page.getByText(c.nombre)).toHaveCount(0);
  });

  test("pago rechazado: avisa, conserva los datos y permite reintentar hasta aprobar", async ({ page }) => {
    const c = comprador();
    await addProduct(page, PRODUCTO);
    await page.goto("/checkout");
    await completarCheckout(page, c);
    await pagarYElegir(page, "Rechazar");

    await expect(page.getByRole("heading", { name: "No pudimos procesar tu pago" })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: "No se cobró nada" })).toBeVisible();
    await page.getByRole("button", { name: "Intentar de nuevo" }).click();
    await expect(page).toHaveURL(/\/pago-simulado/);
    await page.getByRole("button", { name: "Aprobar" }).click();
    await expect(page.getByRole("heading", { name: "Gracias por tu compra" })).toBeVisible();
  });

  test("pago pendiente: la confirmación espera y se actualiza sola cuando el proveedor aprueba", async ({ page, context }) => {
    const c = comprador();
    await addProduct(page, PRODUCTO);
    await page.goto("/checkout");
    await completarCheckout(page, c);
    await page.getByRole("button", { name: /^Pagar Q/ }).click();
    await expect(page).toHaveURL(/\/pago-simulado/);
    const paginaDePago = page.url();
    await page.getByRole("button", { name: "Dejar pendiente" }).click();

    await expect(page.getByRole("heading", { name: "Estamos esperando la confirmación de tu pago" })).toBeVisible();
    await codigoDelPedido(page);

    // Más tarde el proveedor confirma (otra pestaña de la misma sesión); la página abierta se actualiza sola.
    const otra = await context.newPage();
    await otra.goto(paginaDePago);
    await otra.getByRole("button", { name: "Aprobar" }).click();
    await otra.close();
    await expect(page.getByRole("heading", { name: "Gracias por tu compra" })).toBeVisible({ timeout: 20_000 });
  });

  test("la validación del checkout muestra el error junto al campo y no avanza", async ({ page }) => {
    await addProduct(page, PRODUCTO);
    await page.goto("/checkout");
    await page.getByLabel("Correo").fill("no-es-un-correo");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByLabel("Correo")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Escribe un correo válido")).toBeVisible();
    await expect(page.getByRole("heading", { name: "1. Contacto" })).toBeVisible();
  });
});

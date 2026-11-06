import { expect, test, type Page } from "@playwright/test";
import { addProduct, codigoDelPedido, comprador, completarCheckout } from "./ayudas";

const ADMIN = { correo: process.env.SEED_ADMIN_EMAIL ?? "admin@zorztech.test", clave: process.env.SEED_ADMIN_PASSWORD ?? "Admin-ZorzTech-2026" };

async function ingresarComoAdmin(page: Page) {
  await page.goto("/ingresar?volver=/admin");
  await page.getByLabel("Correo").fill(ADMIN.correo);
  await page.getByLabel("Contraseña").fill(ADMIN.clave);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL((url) => url.pathname === "/admin");
}

async function guardarTransferencia(page: Page, activa: boolean) {
  await page.goto("/admin/configuracion");
  await page.getByLabel("Banco", { exact: true }).fill("Banco E2E");
  await page.getByLabel("Titular de la cuenta").fill("ZorzTech E2E");
  await page.getByLabel("Número de cuenta").fill("0123456789");
  const casilla = page.getByLabel("Ofrecer pago por transferencia");
  if (activa) await casilla.check();
  else await casilla.uncheck();
  await page.getByRole("button", { name: "Guardar transferencia" }).click();
  await expect(page.getByText(/Guardamos los datos\./)).toBeVisible();
}

test.describe("pago por transferencia", () => {
  test("el panel la activa, el cliente ve la cuenta y el administrador confirma el pago", async ({ page, browser }) => {
    await ingresarComoAdmin(page);

    // Activarla exige los datos de la cuenta.
    await page.goto("/admin/configuracion");
    await page.getByLabel("Banco", { exact: true }).fill("");
    await page.getByLabel("Ofrecer pago por transferencia").check();
    await page.getByRole("button", { name: "Guardar transferencia" }).click();
    await expect(page.getByText("Escribe el nombre del banco.")).toBeVisible();

    await guardarTransferencia(page, true);

    try {
      const cliente = await browser.newContext();
      const tienda = await cliente.newPage();
      const c = comprador();
      await addProduct(tienda, "cable-usb-c-trenzado");
      await tienda.getByRole("link", { name: "Ir a pagar" }).click();
      await completarCheckout(tienda, c, /Transferencia bancaria/);
      await tienda.getByRole("button", { name: /^Confirmar pedido Q/ }).click();

      const codigo = await codigoDelPedido(tienda);
      await expect(tienda.getByRole("heading", { name: "Tu pedido está apartado: falta tu transferencia" })).toBeVisible();
      const datos = tienda.getByRole("region", { name: "Datos para tu transferencia" });
      await expect(datos).toContainText("Banco E2E");
      await expect(datos).toContainText("ZorzTech E2E");
      await expect(datos).toContainText("0123456789");
      await expect(datos).toContainText(codigo);

      // Subir el comprobante: queda guardado y el cliente puede volver a abrirlo.
      const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
      await tienda.getByLabel(/Foto o captura/).setInputFiles({ name: "comprobante.png", mimeType: "image/png", buffer: png });
      await tienda.getByRole("button", { name: "Enviar comprobante" }).click();
      await expect(tienda.getByText(/Recibimos tu comprobante/)).toBeVisible();
      await expect(tienda.getByRole("link", { name: /Ver comprobante 1/ })).toBeVisible();

      // El enlace directo del pedido funciona sin sesión ni cookie; el comprobante no se ve sin ese enlace.
      const enlace = (await tienda.getByText(/\/confirmacion\?t=/).first().textContent())!.trim();
      const directo = new URL(enlace);
      const visitante = await browser.newContext();
      const anonimo = await visitante.newPage();
      expect((await anonimo.request.get(`/api/pedidos/${codigo}/comprobante/0`)).status()).toBe(404);
      await anonimo.goto(directo.pathname + directo.search);
      await expect(anonimo.getByRole("heading", { name: "Tu pedido está apartado: falta tu transferencia" })).toBeVisible();
      const imagen = await anonimo.request.get(`/api/pedidos/${codigo}/comprobante/0${directo.search}`);
      expect(imagen.status()).toBe(200);
      expect(imagen.headers()["content-type"]).toBe("image/png");
      // Un enlace alterado no sirve.
      await anonimo.goto(`/pedido/${codigo}/confirmacion?t=${"0".repeat(32)}`);
      await expect(anonimo).toHaveURL(/\/pedido\/seguimiento/);
      await visitante.close();

      // El carrito se vació: el pedido ya tiene sus productos apartados.
      await tienda.goto("/carrito");
      await expect(tienda.getByText("Tu carrito está vacío").first()).toBeVisible();

      // El administrador ve el pedido pendiente y confirma la transferencia.
      await page.goto(`/admin/pedidos/${codigo}`);
      await expect(page.getByText("transferencia", { exact: true })).toBeVisible();
      await expect(page.getByText("Comprobantes del cliente")).toBeVisible();
      await expect(page.getByRole("link", { name: /Abrir comprobante 1/ })).toBeVisible();
      await page.goto(`/admin/pedidos?q=${codigo}`);
      await expect(page.getByText("Con comprobante")).toBeVisible();
      await page.goto(`/admin/pedidos/${codigo}`);
      await page.getByRole("button", { name: "Marcar como pagado" }).click();
      await page.getByRole("dialog", { name: "Confirmar cambio" }).getByRole("button", { name: "Sí, continuar" }).click();
      await expect(page.getByText(/pasó a «Pagado»/)).toBeVisible();

      // El cliente ve su pedido pagado.
      await tienda.goto(`/pedido/${codigo}/confirmacion`);
      await expect(tienda.getByRole("heading", { name: "Gracias por tu compra" })).toBeVisible();
      await cliente.close();
    } finally {
      await guardarTransferencia(page, false);
    }
  });

  test("desactivada, la transferencia no aparece en el pago", async ({ page }) => {
    await addProduct(page, "cable-usb-c-trenzado");
    await page.getByRole("link", { name: "Ir a pagar" }).click();
    await page.getByLabel("Nombre completo").fill("Ana López");
    await page.getByLabel("Correo").fill("ana@correo.test");
    await page.getByLabel("Teléfono").fill("5555 1234");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByLabel("Nombre de quien recibe").fill("Ana López");
    await page.getByLabel("Teléfono de quien recibe").fill("5555 1234");
    await page.getByLabel("Departamento").selectOption("Guatemala");
    await page.getByLabel("Municipio").fill("Mixco");
    await page.getByLabel("Dirección", { exact: true }).fill("Zona 1, 5a calle 3-20");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Usar consumidor final (CF)" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByRole("heading", { name: "4. Pago" })).toBeVisible();
    await expect(page.getByLabel(/Pago en línea de prueba/)).toBeVisible();
    await expect(page.getByLabel(/Transferencia bancaria/)).toHaveCount(0);
  });
});

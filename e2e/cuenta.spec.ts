import { expect, test, type Page } from "@playwright/test";
import { addProduct, unique } from "./ayudas";

const CLAVE = "Clave-de-prueba-2026";

async function registrar(page: Page, correo: string, nombre = "Beatriz Morales") {
  await page.goto("/registro");
  await page.getByLabel("Nombre completo").fill(nombre);
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel("Contraseña").fill(CLAVE);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/cuenta/);
}

async function cerrarSesion(page: Page) {
  await page.goto("/cuenta");
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("/");
}

test.describe("cuenta de cliente", () => {
  test("registro, direcciones guardadas y cierre de sesión", async ({ page }) => {
    const correo = `bea-${unique()}@correo.test`;
    await registrar(page, correo);
    await expect(page.getByRole("heading", { name: "Hola, Beatriz" })).toBeVisible();

    await page.goto("/cuenta/direcciones");
    await page.getByRole("button", { name: "Agregar dirección" }).click();
    await page.getByRole("button", { name: "Guardar dirección" }).click();
    await expect(page.getByText("Elige un departamento.")).toBeVisible();

    await page.getByLabel("Nombre de quien recibe").fill("Beatriz Morales");
    await page.getByLabel("Teléfono").fill("5555 4321");
    await page.getByLabel("Departamento").selectOption("Sacatepéquez");
    await page.getByLabel("Municipio").fill("Antigua Guatemala");
    await page.getByLabel("Dirección", { exact: true }).fill("4a calle oriente 12");
    await page.getByRole("button", { name: "Guardar dirección" }).click();
    await expect(page.getByText("4a calle oriente 12, Antigua Guatemala, Sacatepéquez")).toBeVisible();
    await expect(page.getByText("Predeterminada")).toBeVisible();

    await cerrarSesion(page);
    await page.goto("/cuenta");
    await expect(page).toHaveURL(/\/ingresar\?volver=/);
  });

  test("ingreso: mensaje genérico con datos incorrectos y bloqueo tras varios intentos", async ({ page }) => {
    const correo = `bloqueo-${unique()}@correo.test`;
    await registrar(page, correo);
    await cerrarSesion(page);

    for (let i = 0; i < 5; i++) {
      await page.goto("/ingresar");
      await page.getByLabel("Correo").fill(correo);
      await page.getByLabel("Contraseña").fill("incorrecta-" + i);
      await page.getByRole("button", { name: "Ingresar" }).click();
      await expect(page.getByRole("alert").filter({ hasText: "no coinciden" })).toBeVisible();
    }
    // Con la cuenta bloqueada ni la contraseña correcta entra, y el mensaje no revela el motivo.
    await page.goto("/ingresar");
    await page.getByLabel("Correo").fill(correo);
    await page.getByLabel("Contraseña").fill(CLAVE);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "no coinciden" })).toBeVisible();
    await expect(page).toHaveURL(/\/ingresar/);
  });

  test("el carrito de invitado se combina con el de la cuenta al ingresar", async ({ page }) => {
    const correo = `carrito-${unique()}@correo.test`;
    await registrar(page, correo);
    await page.goto("/productos/cargador-usb-c-65w");
    await page.getByRole("button", { name: "Agregar al carrito" }).first().click();
    await expect(page.getByRole("dialog", { name: "Tu carrito" })).toBeVisible();
    await cerrarSesion(page);

    // Como invitado agrega otro producto.
    await addProduct(page, "cable-usb-c-trenzado");
    await page.goto("/ingresar");
    await page.getByLabel("Correo").fill(correo);
    await page.getByLabel("Contraseña").fill(CLAVE);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/cuenta/);

    await page.goto("/carrito");
    await expect(page.getByRole("link", { name: "Cargador USB-C 65 W" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Cable USB-C trenzado" })).toBeVisible();
  });

  test("cambiar la contraseña exige la actual", async ({ page }) => {
    await registrar(page, `clave-${unique()}@correo.test`);
    await page.goto("/cuenta/datos");
    await page.getByLabel("Contraseña actual").fill("no-es-esta");
    await page.getByLabel("Nueva contraseña").fill("Otra-clave-2026");
    await page.getByRole("button", { name: "Cambiar contraseña" }).click();
    await expect(page.getByText("La contraseña actual no es correcta.")).toBeVisible();

    // Tras un intento los campos de contraseña se vacían: hay que escribirlos otra vez.
    await page.getByLabel("Contraseña actual").fill(CLAVE);
    await page.getByLabel("Nueva contraseña").fill("Otra-clave-2026");
    await page.getByRole("button", { name: "Cambiar contraseña" }).click();
    await expect(page.getByText("Cambiaste tu contraseña.")).toBeVisible();
  });

  test("un pedido hecho con sesión aparece en la cuenta y solo su dueño lo ve", async ({ page, browser }) => {
    const correo = `pedido-${unique()}@correo.test`;
    await registrar(page, correo, "Carla Pérez");
    await addProduct(page, "cable-usb-c-trenzado");
    await page.goto("/checkout");
    await page.getByLabel("Teléfono").fill("55551234");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByLabel("Teléfono de quien recibe").fill("55551234");
    await page.getByLabel("Departamento").selectOption("Guatemala");
    await page.getByLabel("Municipio").fill("Mixco");
    await page.getByLabel("Dirección", { exact: true }).fill("Zona 1, 5a calle 3-20");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Usar consumidor final (CF)" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByLabel(/Pago en línea de prueba/).check();
    await page.getByLabel(/Acepto los/).check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: /^Pagar Q/ }).click();
    await page.getByRole("button", { name: "Aprobar" }).click();
    await expect(page.getByRole("heading", { name: "Gracias por tu compra" })).toBeVisible();
    const codigo = page.url().match(/ZT-[A-Z0-9]{8}/)![0];

    await page.goto("/cuenta/pedidos");
    await expect(page.getByRole("link", { name: codigo })).toBeVisible();
    await page.getByRole("link", { name: codigo }).click();
    await expect(page.getByText("Pagado").first()).toBeVisible();

    // Otra persona con otra sesión no puede abrir el detalle de la cuenta.
    const otra = await browser.newContext();
    const pagina = await otra.newPage();
    await pagina.goto(`/cuenta/pedidos/${codigo}`);
    await expect(pagina).toHaveURL(/\/ingresar/);
    await otra.close();
  });
});

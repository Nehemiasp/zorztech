import { expect, type Page } from "@playwright/test";

export const unique = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Agrega al carrito el producto de la ficha y espera a que se abra el cajón. */
export async function addProduct(page: Page, slug: string) {
  await page.goto(`/productos/${slug}`);
  await page.getByRole("button", { name: "Agregar al carrito" }).first().click();
  await expect(page.getByRole("dialog", { name: "Tu carrito" })).toBeVisible();
}

export interface Comprador {
  nombre: string;
  correo: string;
  telefono: string;
}

export const comprador = (): Comprador => ({ nombre: "Ana López", correo: `ana-${unique()}@correo.test`, telefono: "5555 1234" });

/** Recorre los cinco pasos del checkout con entrega a domicilio. */
export async function completarCheckout(page: Page, c: Comprador) {
  await page.getByLabel("Nombre completo").fill(c.nombre);
  await page.getByLabel("Correo").fill(c.correo);
  await page.getByLabel("Teléfono").fill(c.telefono);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByRole("heading", { name: "2. Entrega" })).toBeVisible();
  await page.getByLabel("Nombre de quien recibe").fill(c.nombre);
  await page.getByLabel("Teléfono de quien recibe").fill(c.telefono);
  await page.getByLabel("Departamento").selectOption("Guatemala");
  await page.getByLabel("Municipio").fill("Mixco");
  await page.getByLabel("Dirección", { exact: true }).fill("Zona 1, 5a calle 3-20");
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByRole("heading", { name: "3. Facturación" })).toBeVisible();
  await page.getByRole("button", { name: "Usar consumidor final (CF)" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByRole("heading", { name: "4. Pago" })).toBeVisible();
  await page.getByLabel(/Pago en línea de prueba/).check();
  await page.getByLabel(/Acepto los/).check();
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByRole("heading", { name: "5. Revisión" })).toBeVisible();
}

export async function pagarYElegir(page: Page, resultado: "Aprobar" | "Rechazar" | "Dejar pendiente") {
  await page.getByRole("button", { name: /^Pagar Q/ }).click();
  await expect(page).toHaveURL(/\/pago-simulado/);
  await page.getByRole("button", { name: resultado }).click();
}

export async function codigoDelPedido(page: Page): Promise<string> {
  await expect(page).toHaveURL(/\/pedido\/ZT-[A-Z0-9]{8}\/confirmacion/);
  return page.url().match(/ZT-[A-Z0-9]{8}/)![0];
}

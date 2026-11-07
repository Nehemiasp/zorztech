import { expect, test } from "@playwright/test";

test.describe("categorías del inicio", () => {
  test("en móvil son un carrusel con flechas y en escritorio una cuadrícula", async ({ page, isMobile }) => {
    await page.goto("/");
    const next = page.getByRole("button", { name: "Más categorías" });
    const prev = page.getByRole("button", { name: "Categorías anteriores" });

    if (!isMobile) {
      await expect(next).toBeHidden();
      await expect(page.getByRole("link", { name: "Celulares" }).first()).toBeVisible();
      return;
    }

    const carrusel = page.getByRole("region", { name: /Categorías: desliza/ });
    await carrusel.scrollIntoViewIfNeeded();
    await expect(prev).toBeDisabled();
    const antes = await carrusel.evaluate((el) => el.scrollLeft);
    await next.click();
    await expect.poll(() => carrusel.evaluate((el) => el.scrollLeft)).toBeGreaterThan(antes);
    await expect(prev).toBeEnabled();
    // Se puede llegar al final con las flechas y ahí no hay más que avanzar.
    for (let i = 0; i < 8; i++) {
      // Al llegar al final la flecha se deshabilita mientras se hace clic: ahí termina el recorrido.
      if (!(await next.click({ timeout: 1500 }).then(() => true, () => false))) break;
    }
    await expect(next).toBeDisabled();
    // La página no se desborda a los lados por culpa del carrusel.
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });
});

import { expect, test } from "@playwright/test";

const sinDesborde = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe("inicio", () => {
  test("las categorías van en una sola fila que se desliza", async ({ page, isMobile }) => {
    await page.goto("/");
    const fila = page.getByRole("region", { name: /Categorías: desliza/ });
    await fila.scrollIntoViewIfNeeded();
    await expect(fila.getByRole("link", { name: "Celulares" })).toBeVisible();
    // Hay más categorías de las que caben: la fila se desliza en lugar de partirse en renglones.
    expect(await fila.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);

    const next = page.getByRole("button", { name: "Más en Categorías" });
    const prev = page.getByRole("button", { name: "Anteriores en Categorías" });

    if (isMobile) {
      // En celular se desliza con el dedo; las flechas quedan para escritorio.
      await expect(next).toBeHidden();
      await fila.evaluate((el) => el.scrollBy({ left: 200 }));
      await expect.poll(() => fila.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    } else {
      await expect(prev).toBeDisabled();
      const antes = await fila.evaluate((el) => el.scrollLeft);
      await next.click();
      await expect.poll(() => fila.evaluate((el) => el.scrollLeft)).toBeGreaterThan(antes);
      await expect(prev).toBeEnabled();
      for (let i = 0; i < 6; i++) {
        // Al llegar al final la flecha se deshabilita mientras se hace clic: ahí termina el recorrido.
        if (!(await next.click({ timeout: 1500 }).then(() => true, () => false))) break;
      }
      await expect(next).toBeDisabled();
    }
    expect(await sinDesborde(page)).toBe(0);
  });

  test("las filas de productos llevan a la ficha al tocar la tarjeta, sin botones en la tarjeta", async ({ page }) => {
    await page.goto("/");
    const novedades = page.getByRole("region", { name: /Novedades: desliza/ });
    await novedades.scrollIntoViewIfNeeded();
    await expect(novedades.getByRole("button")).toHaveCount(0);
    const primero = novedades.getByRole("article").first().getByRole("link");
    const nombre = (await primero.textContent())!.trim();
    await primero.click();
    await expect(page).toHaveURL(/\/productos\//);
    await expect(page.getByRole("heading", { level: 1, name: nombre })).toBeVisible();
  });
});

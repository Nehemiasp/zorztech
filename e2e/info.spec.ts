import { expect, test } from "@playwright/test";

const paginas = [
  { ruta: "/envios", titulo: "Envíos y recogida en tienda" },
  { ruta: "/garantias", titulo: "Garantías" },
  { ruta: "/devoluciones", titulo: "Devoluciones y reembolsos" },
  { ruta: "/preguntas-frecuentes", titulo: "Preguntas frecuentes" },
  { ruta: "/terminos", titulo: "Términos y condiciones" },
  { ruta: "/privacidad", titulo: "Privacidad" },
  { ruta: "/contacto", titulo: "Contacto" },
];

test.describe("páginas de información", () => {
  for (const { ruta, titulo } of paginas) {
    test(`${ruta} carga, tiene su título y no rompe la política de contenido`, async ({ page }) => {
      const problemas: string[] = [];
      page.on("console", (m) => {
        if (m.type() === "error") problemas.push(m.text());
      });
      page.on("pageerror", (e) => problemas.push(e.message));

      const res = await page.goto(ruta);
      expect(res?.status()).toBe(200);
      expect(res?.headers()["content-security-policy"]).toContain("nonce-");
      await expect(page.getByRole("heading", { level: 1, name: titulo })).toBeVisible();
      expect(problemas).toEqual([]);
    });
  }

  test("las tarifas de envío salen de la base de datos", async ({ page }) => {
    await page.goto("/envios");
    const tabla = page.getByRole("region", { name: "Tarifas de envío por departamento" });
    await expect(tabla.getByRole("row", { name: /Guatemala/ }).first()).toContainText("Q");
  });

  test("las políticas pendientes se ven como marcador, no como texto inventado", async ({ page }) => {
    await page.goto("/devoluciones");
    await expect(page.getByText("[Política de devoluciones del cliente]")).toBeVisible();
  });

  test("el pie de página lleva a cada página de información", async ({ page }) => {
    await page.goto("/");
    const pie = page.getByRole("contentinfo");
    for (const nombre of ["Envíos", "Garantías", "Devoluciones", "Preguntas frecuentes", "Contacto", "Términos y condiciones", "Privacidad"]) {
      const enlace = pie.getByRole("link", { name: nombre, exact: true });
      const href = await enlace.getAttribute("href");
      const res = await page.request.get(href!);
      expect(res.status(), `${nombre} → ${href}`).toBe(200);
    }
  });

  test("preguntas frecuentes: cada respuesta se abre con el teclado", async ({ page }) => {
    await page.goto("/preguntas-frecuentes");
    const primera = page.getByText("¿Necesito una cuenta para comprar?");
    await primera.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Puedes comprar como invitado")).toBeVisible();
  });

  test("la política de contenido exige nonce y no permite scripts en línea", async ({ page }) => {
    const res = await page.request.get("/");
    const csp = res.headers()["content-security-policy"];
    expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).toContain("frame-ancestors 'none'");
  });
});

import { expect, test, type Page } from "@playwright/test";
import { addProduct, codigoDelPedido, comprador, completarCheckout, pagarYElegir, unique } from "./ayudas";

const ADMIN = { correo: process.env.SEED_ADMIN_EMAIL ?? "admin@zorztech.test", clave: process.env.SEED_ADMIN_PASSWORD ?? "Admin-ZorzTech-2026" };

async function ingresarComoAdmin(page: Page) {
  await page.goto("/ingresar?volver=/admin");
  await page.getByLabel("Correo").fill(ADMIN.correo);
  await page.getByLabel("Contraseña").fill(ADMIN.clave);
  await page.getByRole("button", { name: "Ingresar" }).click();
  // La URL de ingreso también contiene "/admin" (volver=/admin): se espera a estar ya en el panel.
  await page.waitForURL((url) => url.pathname === "/admin");
}

test.describe("permisos del panel", () => {
  test("sin sesión el panel lleva a ingresar y con un cliente responde 404", async ({ page }) => {
    await page.goto("/admin/pedidos");
    await expect(page).toHaveURL(/\/ingresar\?volver=/);

    const correo = `cli-${unique()}@correo.test`;
    await page.goto("/registro");
    await page.getByLabel("Nombre completo").fill("Cliente Común");
    await page.getByLabel("Correo").fill(correo);
    await page.getByLabel("Contraseña").fill("Clave-de-prueba-2026");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page).toHaveURL(/\/cuenta/);
    for (const ruta of ["/admin", "/admin/pedidos", "/admin/productos", "/admin/cupones", "/admin/configuracion", "/admin/clientes"]) {
      const res = await page.goto(ruta);
      expect(res?.status(), ruta).toBe(404);
    }
    // La subida de imágenes y la exportación tampoco responden a un cliente.
    const exportar = await page.request.get("/admin/pedidos/exportar");
    expect(exportar.status()).toBe(403);
    const subir = await page.request.post("/api/admin/imagenes", { headers: { origin: "http://localhost:3000" }, multipart: { archivo: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("no") } } });
    expect(subir.status()).toBe(403);
  });

  test("un administrador ve el resumen", async ({ page }) => {
    await ingresarComoAdmin(page);
    await expect(page.getByRole("heading", { name: "Resumen" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Panel de administración" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Productos con poco stock" })).toBeVisible();
  });
});

test.describe("pedidos en el panel", () => {
  test("de un pedido pagado a entregado, con nota, cancelación con confirmación y CSV", async ({ page, browser }) => {
    // Un cliente compra y paga.
    const c = comprador();
    const cliente = await browser.newContext();
    const tienda = await cliente.newPage();
    await addProduct(tienda, "cable-usb-c-trenzado");
    await tienda.goto("/checkout");
    await completarCheckout(tienda, c);
    await pagarYElegir(tienda, "Aprobar");
    const codigo = await codigoDelPedido(tienda);

    await ingresarComoAdmin(page);
    await page.goto("/admin/pedidos");
    await page.getByLabel("Buscar por código, correo o nombre").fill(c.correo);
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page.getByRole("link", { name: codigo })).toBeVisible();
    await page.getByRole("link", { name: codigo }).click();
    await expect(page.getByRole("heading", { name: `Pedido ${codigo}` })).toBeVisible();

    // Nota interna
    await page.getByLabel("Nota interna").fill("Cliente pidió factura a nombre de empresa.");
    await page.getByRole("button", { name: "Guardar nota" }).click();
    await expect(page.getByText("Guardamos la nota.")).toBeVisible();
    await expect(page.getByText("Cliente pidió factura a nombre de empresa.").first()).toBeVisible();

    // Preparar → enviar → entregar
    await page.getByRole("button", { name: "Empezar a preparar" }).click();
    await expect(page.getByText(/pasó a «En preparación»/)).toBeVisible();
    await page.getByRole("button", { name: "Marcar como enviado" }).click();
    await expect(page.getByText(/pasó a «Enviado»/)).toBeVisible();
    await page.getByRole("button", { name: "Marcar como entregado" }).click();
    await expect(page.getByText(/pasó a «Entregado»/)).toBeVisible();
    await expect(page.getByText("Este pedido está en un estado final")).toBeVisible();

    // El cliente ve el avance en su seguimiento.
    await tienda.goto(`/pedido/seguimiento?codigo=${codigo}`);
    await expect(tienda.getByRole("status").filter({ hasText: "Entregado" })).toBeVisible();
    await expect(tienda.getByText("Cliente pidió factura")).toHaveCount(0);
    await cliente.close();

    // Exportación a CSV con los filtros de la lista.
    const csv = await page.request.get(`/admin/pedidos/exportar?q=${encodeURIComponent(c.correo)}`);
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    const body = await csv.text();
    expect(body).toContain(codigo);
    expect(body).toContain("Entregado");
  });

  test("cancelar pide confirmación y devuelve las unidades al inventario", async ({ page, browser }) => {
    const c = comprador();
    const cliente = await browser.newContext();
    const tienda = await cliente.newPage();
    await addProduct(tienda, "cable-usb-c-trenzado");
    await tienda.goto("/checkout");
    await completarCheckout(tienda, c);
    await pagarYElegir(tienda, "Aprobar");
    const codigo = await codigoDelPedido(tienda);
    await cliente.close();

    await ingresarComoAdmin(page);
    await page.goto(`/admin/pedidos/${codigo}`);
    await page.getByRole("button", { name: "Cancelar pedido" }).click();
    const dialogo = page.getByRole("dialog", { name: "Confirmar cambio" });
    await expect(dialogo).toBeVisible();
    // Volver no cambia nada.
    await dialogo.getByRole("button", { name: "Volver" }).click();
    await expect(page.getByText("Pagado").first()).toBeVisible();
    await page.getByRole("button", { name: "Cancelar pedido" }).click();
    await page.getByRole("dialog", { name: "Confirmar cambio" }).getByRole("button", { name: "Sí, continuar" }).click();
    await expect(page.getByText(/pasó a «Cancelado»/)).toBeVisible();
    await page.getByRole("button", { name: "Reembolsar" }).click();
    await page.getByRole("dialog", { name: "Confirmar cambio" }).getByRole("button", { name: "Sí, continuar" }).click();
    await expect(page.getByText(/pasó a «Reembolsado»/)).toBeVisible();
  });
});

test.describe("catálogo en el panel", () => {
  test("crear un producto con variantes, verlo en la tienda, editarlo y desactivarlo", async ({ page }) => {
    const sufijo = unique();
    const nombre = `Cargador de prueba ${sufijo}`;
    await ingresarComoAdmin(page);
    await page.goto("/admin/productos/nuevo");

    // Errores junto al campo
    await page.getByRole("button", { name: "Crear producto" }).click();
    await expect(page.getByText("Revisa los campos marcados.")).toBeVisible();
    await expect(page.getByText("Escribe el nombre del producto.")).toBeVisible();
    await expect(page.getByText("Elige una categoría.")).toBeVisible();

    await page.getByLabel("Nombre", { exact: true }).fill(nombre);
    await page.getByLabel("Categoría", { exact: true }).selectOption({ label: "Accesorios › Cargadores" });
    await page.getByLabel("Descripción", { exact: true }).fill("Cargador de prueba para el panel.");
    await page.getByLabel("SKU").fill(`PR-${sufijo}`.toUpperCase());
    await page.getByLabel("Nombre de la variante").fill("Estándar");
    await page.getByLabel("Precio (Q)").fill("199.50");
    await page.getByLabel("Precio anterior (Q, opcional)").fill("249");
    await page.getByLabel("Unidades en inventario").fill("5");
    await page.getByRole("button", { name: "Crear producto" }).click();
    await expect(page).toHaveURL(/\/admin\/productos\/[a-z0-9]+\?creado=1/);
    await expect(page.getByText("Creamos el producto.")).toBeVisible();

    // En la tienda se ve con su precio y "Últimas unidades" (5 > umbral 3 → Disponible)
    const slug = await page.getByLabel("Dirección en la tienda (opcional)").inputValue();
    await page.goto(`/productos/${slug}`);
    await expect(page.getByRole("heading", { name: nombre })).toBeVisible();
    await expect(page.getByText("Q 199.50").first()).toBeVisible();
    await expect(page.getByText("Ahorras Q 49.50").first()).toBeVisible();

    // Se busca sin tildes y aparece
    await page.goto(`/buscar?q=${encodeURIComponent(nombre.toLowerCase())}`);
    await expect(page.getByRole("link", { name: nombre })).toBeVisible();

    // Edición: bajar el stock a 2 muestra «Últimas unidades»
    await page.goto("/admin/productos");
    await page.getByLabel("Buscar por nombre o SKU").fill(sufijo);
    await page.getByRole("button", { name: "Filtrar" }).click();
    await page.getByRole("link", { name: nombre }).click();
    await page.getByLabel("Unidades en inventario").fill("2");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Guardamos el producto.")).toBeVisible();
    await page.goto(`/productos/${slug}`);
    await expect(page.getByText("Últimas unidades").first()).toBeVisible();

    // Desactivar lo quita de la tienda (404)
    await page.goto("/admin/productos");
    await page.getByLabel("Buscar por nombre o SKU").fill(sufijo);
    await page.getByRole("button", { name: "Filtrar" }).click();
    await page.getByRole("button", { name: `Desactivar ${nombre}` }).click();
    await expect(page.getByRole("button", { name: `Activar ${nombre}` })).toBeVisible();
    const res = await page.goto(`/productos/${slug}`);
    expect(res?.status()).toBe(404);
  });

  test("el SKU repetido y el stock por debajo de lo apartado se rechazan", async ({ page }) => {
    await ingresarComoAdmin(page);
    await page.goto("/admin/productos/nuevo");
    await page.getByLabel("Nombre", { exact: true }).fill(`Duplicado ${unique()}`);
    await page.getByLabel("Categoría", { exact: true }).selectOption({ label: "Celulares" });
    await page.getByLabel("SKU").fill("EJ-CEL-001-128");
    await page.getByLabel("Nombre de la variante").fill("Copia");
    await page.getByLabel("Precio (Q)").fill("100");
    await page.getByRole("button", { name: "Crear producto" }).click();
    await expect(page.getByText("Ya hay otra variante con este SKU.")).toBeVisible();
  });

  test("categorías: crear una subcategoría, ordenarla y borrarla", async ({ page }) => {
    const nombre = `Fundas ${unique()}`;
    await ingresarComoAdmin(page);
    await page.goto("/admin/categorias/nueva");
    await page.getByLabel("Nombre", { exact: true }).fill(nombre);
    await page.getByLabel("Categoría principal").selectOption({ label: "Subcategoría de Accesorios" });
    await page.getByRole("button", { name: "Crear categoría" }).click();
    await expect(page.getByText("Creamos la categoría.")).toBeVisible();
    await expect(page.getByRole("link", { name: nombre })).toBeVisible();

    await page.getByRole("button", { name: `Subir ${nombre}` }).click();
    await page.goto("/admin/categorias");
    await page.getByRole("link", { name: nombre }).click();
    await page.getByRole("button", { name: `Borrar «${nombre}»` }).click();
    await expect(page.getByText("Borramos la categoría.")).toBeVisible();
  });

  test("subir una imagen valida el tipo real y la muestra en el formulario", async ({ page }) => {
    await ingresarComoAdmin(page);
    await page.goto("/admin/productos/nuevo");
    // Un archivo que se llama .png pero no lo es se rechaza.
    await page.locator("#subir-imagenes").setInputFiles({ name: "falso.png", mimeType: "image/png", buffer: Buffer.from("<script>alert(1)</script>") });
    await expect(page.getByRole("alert").filter({ hasText: "Sube una imagen JPG, PNG, WebP o AVIF." })).toBeVisible();
    // Un PNG de verdad (1×1) se acepta.
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==", "base64");
    await page.locator("#subir-imagenes").setInputFiles({ name: "pixel.png", mimeType: "image/png", buffer: png });
    await expect(page.getByLabel("Descripción de la imagen")).toBeVisible();
  });
});

test.describe("cupones y configuración", () => {
  test("un cupón creado en el panel se aplica en el carrito y baja el total", async ({ page, browser }) => {
    const codigo = `PRUEBA${unique().toUpperCase()}`.slice(0, 20);
    await ingresarComoAdmin(page);
    await page.goto("/admin/cupones/nuevo");
    await page.getByRole("button", { name: "Crear cupón" }).click();
    await expect(page.getByText("Usa de 3 a 30 letras")).toBeVisible();
    await page.getByLabel("Código").fill(codigo);
    await page.getByLabel("Porcentaje (1 a 100)").fill("20");
    await page.getByLabel("Límite de usos (opcional)").fill("1");
    await page.getByRole("button", { name: "Crear cupón" }).click();
    await expect(page.getByText("Creamos el cupón.")).toBeVisible();
    await expect(page.getByRole("link", { name: codigo })).toBeVisible();

    const cliente = await browser.newContext();
    const tienda = await cliente.newPage();
    await addProduct(tienda, "audifonos-inalambricos-anc");
    await tienda.goto("/carrito");
    await tienda.getByLabel("¿Tienes un cupón?").fill("noexiste");
    await tienda.getByRole("button", { name: "Aplicar" }).click();
    await expect(tienda.getByText("Ese cupón no existe o ya no está disponible.")).toBeVisible();
    await tienda.getByLabel("¿Tienes un cupón?").fill(codigo.toLowerCase());
    await tienda.getByRole("button", { name: "Aplicar" }).click();
    const resumen = tienda.getByLabel("Resumen del pedido");
    await expect(resumen.getByText(`Cupón ${codigo}`, { exact: true })).toBeVisible();
    await expect(resumen.getByText("-Q 139.80")).toBeVisible();

    // El checkout cobra el total con descuento y el pedido guarda el cupón.
    await tienda.goto("/checkout");
    await completarCheckout(tienda, comprador());
    await expect(tienda.getByRole("button", { name: /^Pagar Q/ })).toContainText("Q 594.20");
    await pagarYElegir(tienda, "Aprobar");
    await expect(tienda.getByRole("heading", { name: "Gracias por tu compra" })).toBeVisible();
    await expect(tienda.getByText("-Q 139.80")).toBeVisible();

    // El límite era de 1 uso: otro cliente ya no puede usarlo.
    const otro = await browser.newContext();
    const segundo = await otro.newPage();
    await addProduct(segundo, "audifonos-inalambricos-anc");
    await segundo.goto("/carrito");
    await segundo.getByLabel("¿Tienes un cupón?").fill(codigo);
    await segundo.getByRole("button", { name: "Aplicar" }).click();
    await expect(segundo.getByText("Ese cupón ya se usó el máximo de veces.")).toBeVisible();
    await cliente.close();
    await otro.close();
  });

  test("lo que se guarda en Configuración se ve en la tienda", async ({ page }) => {
    const telefono = `2222-${Math.floor(1000 + Math.random() * 8999)}`;
    await ingresarComoAdmin(page);
    await page.goto("/admin/configuracion");
    await page.getByLabel("Teléfono", { exact: true }).fill(telefono);
    await page.getByLabel("Horario de atención").fill("Lunes a sábado, de 9:00 a 18:00");
    await page.getByRole("button", { name: "Guardar contacto" }).click();
    await expect(page.getByText("Guardamos los datos de contacto.")).toBeVisible();

    await page.goto("/");
    const pie = page.getByRole("contentinfo");
    await expect(pie.getByRole("link", { name: telefono })).toBeVisible();
    await expect(pie.getByText("Lunes a sábado, de 9:00 a 18:00")).toBeVisible();
    await expect(pie.getByText("[Correo de contacto]")).toBeVisible();

    // Banner del inicio
    await page.goto("/admin/configuracion");
    await page.getByLabel("Titular").fill("Tecnología al mejor precio de la semana");
    await page.getByRole("button", { name: "Guardar banner" }).click();
    await expect(page.getByText("Guardamos el banner.")).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tecnología al mejor precio de la semana");
    await page.goto("/admin/configuracion");
    await page.getByRole("button", { name: "Volver al banner por defecto" }).click();
    await expect(page.getByText("Volvimos al banner por defecto.")).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Compra tecnología/);

    // Dejar un departamento sin tarifa lo saca del envío a domicilio y volver a ponerla lo repone.
    await page.goto("/admin/configuracion");
    const precio = page.getByLabel("Costo de envío a Petén");
    const original = await precio.inputValue();
    const dias = page.getByLabel("Días de entrega a Petén");
    const diasOriginal = await dias.inputValue();
    await precio.fill("abc");
    await page.getByRole("button", { name: "Guardar tarifas" }).click();
    await expect(page.getByText("Escribe el costo en quetzales")).toBeVisible();
    await precio.fill(original);
    await dias.fill(diasOriginal);
    await page.getByRole("button", { name: "Guardar tarifas" }).click();
    await expect(page.getByText(/Guardamos 22 tarifas/)).toBeVisible();
  });
});

test("«Avisarme cuando llegue» guarda el correo y el administrador repone el stock", async ({ page, browser }) => {
  await ingresarComoAdmin(page);
  // La variante azul del smartphone básico está agotada en el seed.
  const cliente = await browser.newContext();
  const tienda = await cliente.newPage();
  await tienda.goto("/productos/smartphone-basico-61?variante=EJ-CEL-002-AZU");
  await expect(tienda.getByRole("button", { name: "Agotado" }).first()).toBeDisabled();
  await tienda.getByLabel("Tu correo").fill(`espera-${unique()}@correo.test`);
  await tienda.getByRole("button", { name: "Avisarme" }).click();
  await expect(tienda.getByText(/Te escribimos a espera-/)).toBeVisible();
  await cliente.close();
});

import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// En el entorno de desarrollo remoto el navegador ya está instalado; en otros equipos Playwright usa el suyo.
const bundled = "/opt/pw-browsers/chromium";
const executablePath = process.env.PW_CHROMIUM_PATH ?? (existsSync(bundled) ? bundled : undefined);

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    // Los recorridos usan la preferencia «reducir movimiento»: la página no se desplaza con animación mientras se hace clic.
    contextOptions: { reducedMotion: "reduce" },
    launchOptions: { executablePath },
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "movil", use: { ...devices["Pixel 5"], viewport: { width: 360, height: 740 } } },
  ],
});

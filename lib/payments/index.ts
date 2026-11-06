import { mockMethods, mockProvider } from "./providers/mock";
import type { PaymentMethod, PaymentProvider } from "./types";

interface ProviderEntry {
  provider: PaymentProvider;
  label: string;
  methods: PaymentMethod[];
}

/**
 * Registro de proveedores. Conectar una pasarela real es agregar su archivo en providers/,
 * sumarla aquí y cambiar PAYMENT_PROVIDER (ver docs/conectar-pasarela.md).
 */
const registry: Record<string, () => ProviderEntry> = {
  mock: () => ({ provider: mockProvider, label: "Pasarela simulada", methods: mockMethods }),
};

function entry(): ProviderEntry {
  const id = process.env.PAYMENT_PROVIDER ?? "mock";
  const make = registry[id];
  if (!make) throw new Error(`PAYMENT_PROVIDER="${id}" no está registrado en lib/payments/index.ts`);
  return make();
}

export const getPaymentProvider = (): PaymentProvider => entry().provider;
export const isMockProvider = (): boolean => (process.env.PAYMENT_PROVIDER ?? "mock") === "mock";

/**
 * La pasarela simulada deja marcar un pedido como pagado sin pagar nada: solo se ofrece en desarrollo y pruebas,
 * o en producción si se pide a propósito con SHOW_MOCK_PAYMENT=1. Un proveedor real no pasa por aquí.
 */
export const mockPaymentVisible = (): boolean =>
  isMockProvider() && (process.env.NODE_ENV !== "production" || process.env.SHOW_MOCK_PAYMENT === "1");

/** Formas de pago del proveedor activo que se ofrecen hoy. Con la pasarela simulada oculta, ninguna. */
export const getPaymentMethods = (): PaymentMethod[] => (isMockProvider() && !mockPaymentVisible() ? [] : entry().methods);

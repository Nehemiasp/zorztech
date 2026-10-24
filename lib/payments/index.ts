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
export const getPaymentMethods = (): PaymentMethod[] => entry().methods;
export const isMockProvider = (): boolean => (process.env.PAYMENT_PROVIDER ?? "mock") === "mock";

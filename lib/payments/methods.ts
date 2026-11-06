import { loadTransfer } from "../settings";
import { transferMethod, transferReady } from "../transfer";
import { getPaymentMethods } from "./index";
import type { PaymentMethod } from "./types";

/** Formas de pago que se le ofrecen hoy al cliente: las del proveedor activo y, si está lista, la transferencia. */
export async function getAvailablePaymentMethods(): Promise<PaymentMethod[]> {
  const transfer = await loadTransfer();
  return [...getPaymentMethods(), ...(transferReady(transfer) ? [transferMethod(transfer)] : [])];
}

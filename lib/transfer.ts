import { z } from "zod";
import type { PaymentMethod } from "./payments/types";

/** Pago por transferencia bancaria: el cliente deposita y el administrador confirma el pago a mano. */
export const TRANSFER_METHOD_ID = "transferencia";

export interface TransferSettings {
  enabled: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  /** Por ejemplo «Monetaria» o «Ahorro». Opcional. */
  accountType: string;
  /** Indicaciones extra para el cliente. Opcional. */
  instructions: string;
  /** Horas que se aparta el pedido esperando la transferencia. */
  holdHours: number;
}

export const defaultTransfer: TransferSettings = {
  enabled: false,
  bankName: "",
  accountName: "",
  accountNumber: "",
  accountType: "",
  instructions: "",
  holdHours: 24,
};


/** Lo que guarda el panel. Con la transferencia activa, el banco, el titular y el número son obligatorios. */
export const transferSchema = z
  .object({
    enabled: z.boolean(),
    bankName: z.string().trim().max(60, "Usa hasta 60 caracteres."),
    accountName: z.string().trim().max(80, "Usa hasta 80 caracteres."),
    accountNumber: z.string().trim().max(40, "Usa hasta 40 caracteres."),
    accountType: z.string().trim().max(30, "Usa hasta 30 caracteres."),
    instructions: z.string().trim().max(300, "Usa hasta 300 caracteres."),
    holdHours: z.number({ error: "Escribe un número de horas." }).int("Usa un número entero.").min(1, "Mínimo 1 hora.").max(168, "Máximo 168 horas (7 días)."),
  })
  .superRefine((v, ctx) => {
    if (!v.enabled) return;
    const required = [
      ["bankName", "Escribe el nombre del banco."],
      ["accountName", "Escribe el nombre del titular de la cuenta."],
      ["accountNumber", "Escribe el número de cuenta."],
    ] as const;
    for (const [key, message] of required) {
      if (v[key].length < 2) ctx.addIssue({ code: "custom", path: [key], message });
    }
  });

/** La transferencia se ofrece solo si está activa y tiene los datos para depositar. */
export function transferReady(t: TransferSettings): boolean {
  return t.enabled && t.bankName.length >= 2 && t.accountName.length >= 2 && t.accountNumber.length >= 2;
}

export const holdText = (hours: number) => (hours % 24 === 0 ? `${hours / 24} ${hours === 24 ? "día" : "días"}` : `${hours} ${hours === 1 ? "hora" : "horas"}`);

export function transferMethod(t: TransferSettings): PaymentMethod {
  return {
    id: TRANSFER_METHOD_ID,
    label: "Transferencia bancaria",
    description: `Depositas o transfieres a nuestra cuenta y confirmamos tu pedido cuando recibimos el dinero. Apartamos tus productos por ${holdText(t.holdHours)}.`,
  };
}


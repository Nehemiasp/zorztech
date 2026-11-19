import { z } from "zod";
import { db } from "../db";
import { detectImageType } from "../storage";
import type { AdminResult } from "./admin";
import { applyTransition, sendOrderStatusEmail, TransitionError } from "./lifecycle";
import { canTransition, statusLabel } from "./status";

/** Guía de envío: el número es obligatorio para marcar un pedido como enviado; la foto o PDF, opcional. */
// Vercel acepta hasta 4.5 MB por petición: 4 MB de archivo deja margen para el resto del formulario.
export const MAX_GUIDE_BYTES = 4 * 1024 * 1024;
const guideTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export type GuideType = (typeof guideTypes)[number];

export const shipmentSchema = z.object({
  trackingNumber: z
    .string()
    .trim()
    .min(3, "Escribe el número de guía.")
    .max(60, "Usa hasta 60 caracteres.")
    .regex(/^[A-Za-z0-9][A-Za-z0-9 ./-]*$/, "Usa solo letras, números, espacios, puntos, guiones o diagonales."),
  carrier: z.string().trim().max(60, "Usa hasta 60 caracteres.").optional(),
});

/** Tipo real del archivo según sus primeros bytes (el que declara el navegador no cuenta). */
export function detectGuideType(bytes: Uint8Array): GuideType | null {
  if (bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-") return "application/pdf";
  const image = detectImageType(bytes);
  return image && (guideTypes as readonly string[]).includes(image) ? (image as GuideType) : null;
}

export interface GuideFile {
  type: GuideType;
  size: number;
  data: Uint8Array<ArrayBuffer>;
}

export type ReadGuideResult = { ok: true; file: GuideFile | null } | { ok: false; message: string };

/** Valida el archivo de la guía. Sin archivo (o vacío) es válido: la foto es opcional. */
export async function readGuideFile(file: File | null): Promise<ReadGuideResult> {
  if (!file || file.size === 0) return { ok: true, file: null };
  if (file.size > MAX_GUIDE_BYTES) return { ok: false, message: "El archivo pesa más de 4 MB. Toma una foto más liviana o reduce el PDF." };
  const data = new Uint8Array(await file.arrayBuffer());
  const type = detectGuideType(data);
  if (!type) return { ok: false, message: "Sube la guía como foto (JPG, PNG o WebP) o PDF." };
  return { ok: true, file: { type, size: data.length, data } };
}

/**
 * Marca un pedido a domicilio como enviado con su número de guía (y empresa y archivo, si los hay).
 * Todo va en una transacción: si algo falla, el pedido sigue «En preparación» y sin guía.
 */
export async function shipOrder(input: {
  code: string;
  trackingNumber: string;
  carrier?: string;
  file?: GuideFile | null;
  actorId: string;
  note?: string;
}): Promise<AdminResult> {
  const order = await db.order.findUnique({ where: { code: input.code }, select: { id: true, code: true, status: true, shippingMethod: true } });
  if (!order) return { ok: false, message: "No encontramos ese pedido." };
  if (order.shippingMethod !== "domicilio") return { ok: false, message: "Este pedido es para recoger en tienda: no lleva guía de envío." };
  if (order.status === "enviado") return { ok: true, message: "El pedido ya está en «Enviado»." };
  if (!canTransition(order.status, "enviado")) {
    return { ok: false, message: `Un pedido «${statusLabel[order.status]}» no puede pasar a «Enviado».` };
  }

  const carrier = input.carrier?.trim() || null;
  const guide = `Guía ${input.trackingNumber}${carrier ? ` (${carrier})` : ""}${input.file ? ", con archivo adjunto" : ""}.`;
  const note = [guide, input.note?.trim()].filter(Boolean).join(" ");

  try {
    await db.$transaction(async (tx) => {
      await applyTransition(tx, order.id, "enviado", { actorId: input.actorId, note });
      await tx.order.update({ where: { id: order.id }, data: { trackingNumber: input.trackingNumber, carrier } });
      if (input.file) {
        const doc = { type: input.file.type, size: input.file.size, data: input.file.data, uploadedAt: new Date() };
        await tx.shipmentDocument.upsert({ where: { orderId: order.id }, update: doc, create: { orderId: order.id, ...doc } });
      }
    });
  } catch (error) {
    if (error instanceof TransitionError) return { ok: false, message: error.message };
    throw error;
  }

  await sendOrderStatusEmail(order.id);
  return { ok: true, message: `El pedido ${order.code} pasó a «Enviado» con la guía ${input.trackingNumber}.` };
}

/** El archivo de la guía de un pedido, para quien tenga acceso a él. */
export async function readShipmentDocument(code: string): Promise<{ data: Uint8Array<ArrayBuffer>; type: string } | null> {
  const doc = await db.shipmentDocument.findFirst({ where: { order: { code } }, select: { data: true, type: true } });
  return doc ? { data: new Uint8Array(doc.data), type: doc.type } : null;
}

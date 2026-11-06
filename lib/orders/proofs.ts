import { db } from "../db";
import { detectImageType } from "../storage";
import { TRANSFER_METHOD_ID } from "../transfer";

/** Comprobantes de transferencia: fotos o capturas que sube el cliente. Se guardan en el registro del pago, sin servicio externo. */
export const MAX_PROOFS = 3;
export const MAX_PROOF_BYTES = 3 * 1024 * 1024;
const proofTypes = ["image/jpeg", "image/png", "image/webp"];

interface StoredProof {
  type: string;
  size: number;
  uploadedAt: string;
  /** Imagen en base64. */
  data: string;
}

/** Lee la lista de comprobantes del JSON del pago, ignorando cualquier cosa que no tenga la forma esperada. */
export function readProofs(raw: unknown): StoredProof[] {
  const list = (raw as { proofs?: unknown } | null)?.proofs;
  if (!Array.isArray(list)) return [];
  return list.filter((p): p is StoredProof => Boolean(p) && typeof p.data === "string" && typeof p.type === "string");
}

export type AddProofResult = { ok: true; count: number } | { ok: false; message: string };

export async function addProof(code: string, file: File): Promise<AddProofResult> {
  if (file.size === 0) return { ok: false, message: "El archivo está vacío." };
  if (file.size > MAX_PROOF_BYTES) return { ok: false, message: "La imagen pesa más de 3 MB. Toma una captura más pequeña o envíala por correo." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type || !proofTypes.includes(type)) return { ok: false, message: "Sube una foto o captura en JPG, PNG o WebP." };

  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { code }, select: { id: true, status: true } });
    if (!order) return { ok: false as const, message: "No encontramos ese pedido." };
    if (order.status !== "pendiente_pago" && order.status !== "expirado") {
      return { ok: false as const, message: "Este pedido ya no espera un comprobante." };
    }
    const payment = await tx.payment.findFirst({ where: { orderId: order.id }, orderBy: { createdAt: "desc" } });
    if (!payment || payment.provider !== TRANSFER_METHOD_ID) {
      return { ok: false as const, message: "Este pedido no es de pago por transferencia." };
    }
    // Se bloquea la fila: dos subidas a la vez no pueden pasarse del límite.
    await tx.$queryRaw`SELECT id FROM payments WHERE id = ${payment.id} FOR UPDATE`;
    const fresh = await tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
    const proofs = readProofs(fresh.rawResponse);
    if (proofs.length >= MAX_PROOFS) return { ok: false as const, message: `Ya subiste ${MAX_PROOFS} comprobantes. Si necesitas enviar otro, escríbenos.` };

    const next: StoredProof = { type, size: bytes.length, uploadedAt: new Date().toISOString(), data: Buffer.from(bytes).toString("base64") };
    const current = (fresh.rawResponse ?? {}) as Record<string, unknown>;
    await tx.payment.update({ where: { id: payment.id }, data: { rawResponse: { ...current, proofs: [...proofs, next] } as object } });
    await tx.orderEvent.create({
      data: { orderId: order.id, type: "comprobante", note: `El cliente subió el comprobante ${proofs.length + 1} de la transferencia.` },
    });
    return { ok: true as const, count: proofs.length + 1 };
  });
}

/** Una imagen de comprobante por su posición (0, 1, 2) para servirla a quien tenga acceso al pedido. */
export async function readProofImage(code: string, index: number): Promise<{ data: Buffer; type: string } | null> {
  if (!Number.isInteger(index) || index < 0 || index >= MAX_PROOFS) return null;
  const payment = await db.payment.findFirst({
    where: { order: { code }, provider: TRANSFER_METHOD_ID },
    orderBy: { createdAt: "desc" },
    select: { rawResponse: true },
  });
  const proof = readProofs(payment?.rawResponse)[index];
  return proof ? { data: Buffer.from(proof.data, "base64"), type: proof.type } : null;
}

/** Cuántos comprobantes tiene un pedido, sin traer las imágenes. */
export async function countProofs(code: string): Promise<number> {
  return db.orderEvent.count({ where: { type: "comprobante", order: { code } } });
}

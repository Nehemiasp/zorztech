"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminUser, noPermission } from "@/lib/admin/guard";
import type { FormState } from "@/lib/auth/actions";
import { OrderStatus } from "@/lib/generated/prisma/client";
import { addOrderNote, changeOrderStatus } from "@/lib/orders/admin";
import { readGuideFile, shipmentSchema, shipOrder } from "@/lib/orders/shipment";

const statusSchema = z.object({
  codigo: z.string().min(4).max(20),
  to: z.enum(Object.values(OrderStatus) as [OrderStatus, ...OrderStatus[]]),
  nota: z.string().trim().max(1000).optional(),
});

export async function changeStatusAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await adminUser();
  if (!admin) return noPermission;
  const parsed = statusSchema.safeParse({ codigo: formData.get("codigo"), to: formData.get("to"), nota: formData.get("nota") ?? undefined });
  if (!parsed.success) return { error: "La solicitud no es válida." };

  const result = await changeOrderStatus({ code: parsed.data.codigo, to: parsed.data.to, actorId: admin.id, note: parsed.data.nota });
  revalidatePath("/admin", "layout");
  return result.ok ? { success: result.message } : { error: result.message };
}

const noteSchema = z.object({ codigo: z.string().min(4).max(20), texto: z.string().trim().min(2, "Escribe la nota.").max(1000, "Usa hasta 1,000 caracteres.") });

export async function addNoteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await adminUser();
  if (!admin) return noPermission;
  const parsed = noteSchema.safeParse({ codigo: formData.get("codigo"), texto: formData.get("texto") });
  if (!parsed.success) return { fields: { texto: parsed.error.issues[0].message } };
  const result = await addOrderNote({ code: parsed.data.codigo, text: parsed.data.texto, actorId: admin.id });
  revalidatePath(`/admin/pedidos/${parsed.data.codigo}`);
  return result.ok ? { success: result.message } : { error: result.message };
}

const shipSchema = shipmentSchema.extend({ codigo: z.string().min(4).max(20), nota: z.string().trim().max(1000).optional() });

/** Marcar como enviado: pide el número de guía y acepta, si se quiere, la foto o el PDF de la guía. */
export async function shipOrderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await adminUser();
  if (!admin) return noPermission;
  const parsed = shipSchema.safeParse({
    codigo: formData.get("codigo"),
    trackingNumber: formData.get("guia") ?? "",
    carrier: formData.get("empresa") || undefined,
    nota: formData.get("nota") || undefined,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue.path[0] === "carrier" ? "empresa" : "guia";
    return { fields: { [field]: issue.message } };
  }
  const upload = formData.get("archivo");
  const guide = await readGuideFile(upload instanceof File ? upload : null);
  if (!guide.ok) return { fields: { archivo: guide.message } };

  const result = await shipOrder({
    code: parsed.data.codigo,
    trackingNumber: parsed.data.trackingNumber,
    carrier: parsed.data.carrier,
    file: guide.file,
    actorId: admin.id,
    note: parsed.data.nota,
  });
  revalidatePath("/admin", "layout");
  return result.ok ? { success: result.message } : { error: result.message };
}

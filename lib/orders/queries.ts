import { cache } from "react";
import { db } from "../db";

export const getOrderByCode = cache(async (code: string) =>
  db.order.findUnique({
    where: { code },
    include: {
      items: { orderBy: { id: "asc" } },
      pickupLocation: true,
      events: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true, provider: true } },
    },
  }),
);

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderByCode>>>;

export interface ShippingAddressView {
  nombre: string;
  telefono: string;
  departamento: string;
  municipio: string;
  direccion: string;
  referencia?: string;
}

export function readShippingAddress(value: unknown): ShippingAddressView | null {
  const a = value as Partial<ShippingAddressView> | null;
  if (!a || typeof a.direccion !== "string") return null;
  return {
    nombre: String(a.nombre ?? ""),
    telefono: String(a.telefono ?? ""),
    departamento: String(a.departamento ?? ""),
    municipio: String(a.municipio ?? ""),
    direccion: a.direccion,
    referencia: a.referencia ? String(a.referencia) : undefined,
  };
}

const dateFormat = new Intl.DateTimeFormat("es-GT", { dateStyle: "long", timeStyle: "short", timeZone: "America/Guatemala" });
const timeFormat = new Intl.DateTimeFormat("es-GT", { timeStyle: "short", timeZone: "America/Guatemala" });

export const formatDateTime = (d: Date) => dateFormat.format(d);
export const formatTime = (d: Date) => timeFormat.format(d);

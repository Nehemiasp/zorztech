import { cache } from "react";
import { z } from "zod";
import { db } from "./db";
import { email } from "./auth/schemas";
import { hero as defaultHero } from "./content/home";
import { defaultShipping, type ShippingSettings } from "./shipping";
import { defaultTransfer, transferSchema, type TransferSettings } from "./transfer";
import { pendingData } from "./site";

/** Datos de contacto que carga el dueño. Mientras un dato esté vacío, la tienda muestra su marcador. */
export const contactSchema = z.object({
  phone: z.string().trim().max(40, "Usa hasta 40 caracteres."),
  email: z.union([z.literal(""), email]),
  hours: z.string().trim().max(120, "Usa hasta 120 caracteres."),
  socials: z.string().trim().max(200, "Usa hasta 200 caracteres."),
  paymentMethods: z.string().trim().max(200, "Usa hasta 200 caracteres."),
});
export type ContactSettings = z.infer<typeof contactSchema>;

export const inventorySchema = z.object({ lowStockDefault: z.coerce.number({ error: "Escribe un número." }).int("Usa un número entero.").min(0, "No puede ser negativo.").max(10_000) });
export type InventorySettings = z.infer<typeof inventorySchema>;

/** Se guarda en centavos; el formulario del panel convierte desde quetzales. */
export const shippingSchema = z.object({
  flatRate: z.number().int().min(0).max(100_000_00),
  freeFrom: z.number().int().min(0).max(100_000_00),
  deliveryTime: z.string().trim().max(80, "Usa hasta 80 caracteres."),
});

/** Datos que entregó el dueño. Valen mientras no guarde otros en el panel (Configuración → Contacto). */
export const defaultContact: ContactSettings = {
  phone: "4187 8256",
  email: "Zorztech@hotmail.com",
  hours: "08:00 a 22:00",
  socials: "IG: ZorzTech",
  paymentMethods: "Transferencia, VisaPago y VisaCuotas",
};

/** Enlace tel: de un teléfono. Un número de 8 dígitos se toma como de Guatemala (+502). */
export function telHref(phone: string): string {
  const digits = phone.replace(/[^+\d]/g, "");
  return `tel:${/^\d{8}$/.test(digits) ? `+502${digits}` : digits}`;
}

export const getStoreSettings = cache(async () => {
  const rows = await db.storeSetting.findMany({ where: { key: { in: ["contacto", "inventario"] } } });
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const contact = contactSchema.safeParse(byKey.get("contacto"));
  const inventory = inventorySchema.safeParse(byKey.get("inventario"));
  return {
    // Sin nada guardado valen los datos iniciales; una vez guardado en el panel, un campo vacío vuelve a mostrar su marcador.
    contact: contact.success ? contact.data : defaultContact,
    inventory: inventory.success ? inventory.data : { lowStockDefault: 3 },
  };
});

/** Envío vigente. Sin nada guardado, valen los valores de partida. Sin caché: el cobro siempre lee lo último. */
export async function loadShipping(): Promise<ShippingSettings> {
  const row = await db.storeSetting.findUnique({ where: { key: "envio" } });
  const parsed = shippingSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : defaultShipping;
}

/** Datos de la cuenta para pagar por transferencia. Sin nada guardado, la transferencia no se ofrece. */
export async function loadTransfer(): Promise<TransferSettings> {
  const row = await db.storeSetting.findUnique({ where: { key: "transferencia" } });
  const parsed = transferSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : defaultTransfer;
}

export async function saveSetting(key: "contacto" | "inventario" | "envio" | "transferencia", value: unknown): Promise<void> {
  const json = JSON.parse(JSON.stringify(value));
  await db.storeSetting.upsert({ where: { key }, update: { value: json }, create: { key, value: json } });
}

/** El dato si ya está cargado; si no, su marcador visible. */
export function contactOrMarker(contact: ContactSettings) {
  const pick = (value: string, marker: string) => ({ value: value || marker, pending: !value });
  return {
    phone: pick(contact.phone, pendingData.phone),
    email: pick(contact.email, pendingData.email),
    hours: pick(contact.hours, pendingData.hours),
    socials: pick(contact.socials, pendingData.socials),
    paymentMethods: pick(contact.paymentMethods, pendingData.paymentMethods),
  };
}

// --- Banner del inicio -------------------------------------------------------------------

export const bannerSchema = z.object({
  title: z.string().trim().min(5, "Escribe el titular.").max(100, "Usa hasta 100 caracteres."),
  body: z.string().trim().min(5, "Escribe el texto de apoyo.").max(240, "Usa hasta 240 caracteres."),
  ctaLabel: z.string().trim().min(2, "Escribe el texto del botón.").max(30, "Usa hasta 30 caracteres."),
  ctaHref: z
    .string()
    .trim()
    .max(300)
    .refine((v) => /^(\/|#|https:\/\/)/.test(v) && !v.startsWith("//"), "Usa una dirección de la tienda (que empiece con /) o un enlace https."),
  imageUrl: z.string().trim().max(500).optional(),
  imageAlt: z.string().trim().max(160, "Usa hasta 160 caracteres."),
  isActive: z.boolean(),
});
export type BannerInput = z.infer<typeof bannerSchema>;

export const getHero = cache(async () => {
  const banner = await db.banner.findFirst({ where: { slot: "hero", isActive: true }, orderBy: { order: "asc" } });
  if (!banner) return defaultHero;
  return {
    title: banner.title,
    body: banner.body,
    primaryCta: { label: banner.ctaLabel, href: banner.ctaHref },
    secondaryCta: defaultHero.secondaryCta,
    image: { src: banner.imageUrl || defaultHero.image.src, alt: banner.imageUrl ? banner.imageAlt || banner.title : defaultHero.image.alt },
    // La versión vertical solo acompaña a la imagen por defecto; un banner con foto propia usa esa foto en todos los anchos.
    imageMobile: banner.imageUrl ? undefined : defaultHero.imageMobile,
  };
});

import { z } from "zod";
import { departamentos } from "../geo/departamentos";
import { email, name, phone } from "../auth/schemas";

/** Reglas del checkout. El mismo esquema valida en el navegador (mensajes junto al campo) y en el servidor. */

const text = (min: number, max: number, minMessage: string) =>
  z.string().trim().min(min, minMessage).max(max, `Usa como máximo ${max} caracteres.`);

export const contactSchema = z.object({ name, email, phone });

export const nit = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^(CF|\d{4,12}-?[\dK])$/, "Escribe tu NIT (por ejemplo 1234567-8) o CF si no necesitas factura a tu nombre.");

export const homeDeliverySchema = z.object({
  method: z.literal("domicilio"),
  nombre: name,
  telefono: phone,
  departamento: z.enum(departamentos, { error: "Elige un departamento." }),
  municipio: text(2, 60, "Escribe el municipio."),
  direccion: text(5, 200, "Escribe la dirección completa: zona, calle, número de casa."),
  referencia: z.string().trim().max(200, "Usa como máximo 200 caracteres.").optional(),
});

export const pickupDeliverySchema = z.object({
  method: z.literal("recogida"),
  pickupLocationId: z.string().min(1, "Elige la tienda donde vas a recoger."),
});

export const deliverySchema = z.discriminatedUnion("method", [homeDeliverySchema, pickupDeliverySchema]);

export const billingSchema = z.object({
  taxId: nit,
  taxName: text(2, 100, "Escribe el nombre para la factura."),
});

export const termsSchema = z.object({
  acceptTerms: z.boolean().refine((v) => v, "Acepta los términos y la política de privacidad para continuar."),
});

export const checkoutSchema = z.object({
  contact: contactSchema,
  delivery: deliverySchema,
  billing: billingSchema,
  paymentMethod: z.string().min(1).max(40),
  acceptTerms: termsSchema.shape.acceptTerms,
  couponCode: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(300).optional(),
  /** Total que el cliente vio en el botón de pagar. El servidor recalcula y, si no coincide, no cobra. */
  expectedTotal: z.number().int().nonnegative(),
  idempotencyKey: z.string().uuid(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type DeliveryInput = z.infer<typeof deliverySchema>;

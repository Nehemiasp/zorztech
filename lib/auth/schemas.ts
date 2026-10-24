import { z } from "zod";

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Escribe tu correo.")
  .max(254)
  .pipe(z.email("Escribe un correo válido, por ejemplo nombre@correo.com."));

export const password = z
  .string()
  .min(8, "Usa al menos 8 caracteres.")
  .max(72, "Usa como máximo 72 caracteres.");

export const name = z.string().trim().min(2, "Escribe tu nombre.").max(80, "Usa como máximo 80 caracteres.");

export const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ""))
  .pipe(
    z
      .string()
      .regex(/^(\+?502)?\d{8}$/, "Escribe un teléfono de 8 dígitos, por ejemplo 5555 1234."),
  );

export const registerSchema = z.object({ name, email, password });
export const loginSchema = z.object({ email, password: z.string().min(1, "Escribe tu contraseña.").max(72) });
export const recoverSchema = z.object({ email });
export const resetSchema = z.object({ token: z.string().min(20).max(100), password });
export const profileSchema = z.object({ name, phone: phone.or(z.literal("")) });
export const changePasswordSchema = z.object({
  current: z.string().min(1, "Escribe tu contraseña actual.").max(72),
  password,
});

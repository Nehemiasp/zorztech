"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "../db";
import { passwordResetEmail } from "../email/templates";
import { sendEmail } from "../email";
import { clientIp, rateLimit } from "../rate-limit";
import { randomToken, sha256 } from "../security";
import { siteConfig } from "../site";
import { auth, getCurrentUser, signIn, signOut } from "./index";
import { hashPassword, verifyPassword } from "./password";
import { safeReturnPath } from "./redirect";
import { changePasswordSchema, loginSchema, profileSchema, recoverSchema, registerSchema, resetSchema } from "./schemas";

export interface FormState {
  error?: string;
  success?: string;
  fields?: Record<string, string>;
  values?: Record<string, string>;
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) fields[String(issue.path[0] ?? "_")] ??= issue.message;
  return fields;
}

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

const tooMany = "Hiciste muchos intentos seguidos. Espera unos minutos e inténtalo de nuevo.";

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: text(formData, "email") };
  const parsed = loginSchema.safeParse({ email: values.email, password: text(formData, "password") });
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };
  if (!rateLimit(`login:${clientIp(await headers())}`, 20, 10 * 60_000)) return { error: tooMany, values };

  try {
    await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      // El mismo mensaje para correo inexistente, contraseña errónea o cuenta bloqueada.
      return {
        error: "El correo o la contraseña no coinciden. Si fallas varias veces seguidas, la cuenta se bloquea 15 minutos.",
        values,
      };
    }
    throw error;
  }
  redirect(safeReturnPath(text(formData, "volver")));
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { name: text(formData, "name"), email: text(formData, "email") };
  const parsed = registerSchema.safeParse({ ...values, password: text(formData, "password") });
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };
  if (!rateLimit(`registro:${clientIp(await headers())}`, 10, 10 * 60_000)) return { error: tooMany, values };

  const { name, email, password } = parsed.data;
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return { fields: { email: "Ese correo ya tiene una cuenta. Ingresa o recupera tu contraseña." }, values };
  }
  await db.user.create({ data: { name, email, passwordHash: await hashPassword(password) } });
  await signIn("credentials", { email, password, redirect: false });
  redirect(safeReturnPath(text(formData, "volver")));
}

export async function googleSignInAction(formData: FormData): Promise<void> {
  await signIn("google", { redirectTo: safeReturnPath(text(formData, "volver")) });
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

const RESET_MINUTES = 60;

export async function requestResetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = recoverSchema.safeParse({ email: text(formData, "email") });
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values: { email: text(formData, "email") } };
  const ip = clientIp(await headers());
  if (!rateLimit(`recuperar-ip:${ip}`, 6, 15 * 60_000) || !rateLimit(`recuperar:${parsed.data.email}`, 3, 15 * 60_000)) {
    return { error: tooMany, values: { email: parsed.data.email } };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const token = randomToken(32);
    await db.$transaction([
      db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      db.passwordResetToken.create({
        data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000) },
      }),
    ]);
    await sendEmail(passwordResetEmail(user.email, user.name, `${siteConfig.url}/recuperar?token=${token}`));
  }
  // Misma respuesta exista o no la cuenta: no se revela qué correos están registrados.
  return { success: "Si ese correo tiene una cuenta, te enviamos un enlace para elegir una nueva contraseña. Funciona durante 1 hora." };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse({ token: text(formData, "token"), password: text(formData, "password") });
  if (!parsed.success) {
    return { fields: fieldErrors(parsed.error), error: parsed.error.issues.some((i) => i.path[0] === "token") ? "El enlace no es válido." : undefined };
  }
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: sha256(parsed.data.token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "El enlace venció o ya se usó. Pide uno nuevo." };
  }
  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(parsed.data.password), failedLogins: 0, lockedUntil: null },
    }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  redirect("/ingresar?reiniciada=1");
}

// --- Cuenta -----------------------------------------------------------------------------------

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?volver=/cuenta/datos");
  const values = { name: text(formData, "name"), phone: text(formData, "phone") };
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name, phone: parsed.data.phone || null } });
  return { success: "Guardamos tus datos.", values };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/ingresar?volver=/cuenta/datos");
  const parsed = changePasswordSchema.safeParse({ current: text(formData, "current"), password: text(formData, "password") });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };
  if (!rateLimit(`clave:${session.user.id}`, 8, 15 * 60_000)) return { error: tooMany };

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true } });
  if (!(await verifyPassword(parsed.data.current, user?.passwordHash))) {
    return { fields: { current: "La contraseña actual no es correcta." } };
  }
  await db.user.update({ where: { id: session.user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } });
  return { success: "Cambiaste tu contraseña." };
}

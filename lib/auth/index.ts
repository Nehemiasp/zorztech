import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Role } from "../generated/prisma/client";
import { db } from "../db";
import { verifyPassword } from "./password";
import { loginSchema } from "./schemas";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }
}

export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

/** Valida correo y contraseña con límite de intentos. Devuelve null ante cualquier fallo, sin decir cuál. */
export async function verifyCredentials(input: unknown) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  const locked = user?.lockedUntil && user.lockedUntil > new Date();
  const valid = await verifyPassword(password, user?.passwordHash);

  if (!user || locked) return null;
  if (!valid) {
    const failed = user.failedLogins + 1;
    await db.user.update({
      where: { id: user.id },
      data:
        failed >= MAX_FAILED_LOGINS
          ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000) }
          : { failedLogins: failed },
    });
    return null;
  }
  if (user.failedLogins > 0 || user.lockedUntil) {
    await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
  }
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/ingresar" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: (credentials) => verifyCredentials(credentials),
    }),
    // Opcional: solo se activa si hay credenciales de Google en el entorno.
    ...(googleEnabled ? [Google] : []),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      if (!profile?.email || profile.email_verified === false) return false;
      const email = profile.email.toLowerCase();
      await db.user.upsert({
        where: { email },
        update: {},
        create: { email, name: profile.name ?? email.split("@")[0] },
      });
      return true;
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === "credentials") {
        token.uid = user.id;
      } else if (account?.provider === "google" && token.email) {
        const found = await db.user.findUnique({ where: { email: token.email.toLowerCase() } });
        if (found) token.uid = found.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      return session;
    },
  },
});

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
}

/** Usuario de la sesión, leído de la base: el rol nunca se toma del token del navegador. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, phone: true, role: true },
  });
  return user;
}

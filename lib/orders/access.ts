import { cookies } from "next/headers";
import { getCurrentUser } from "../auth";
import { sign, verifySignature } from "../security";

const COOKIE = "zt_pedido";

const signed = (code: string) => `${code}.${sign("pedido", code)}`;

/**
 * Da acceso al pedido a quien lo acaba de crear o lo consultó con su código y correo.
 * Es una cookie firmada: el código del pedido solo, en la URL, no basta para ver sus datos.
 */
export async function grantOrderAccess(code: string): Promise<void> {
  (await cookies()).set(COOKIE, signed(code), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function lastAccessedOrder(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 1) return null;
  const code = value.slice(0, dot);
  return verifySignature("pedido", code, value.slice(dot + 1)) ? code : null;
}

/** ¿Puede esta persona ver el pedido? Cookie firmada, dueño de la cuenta o administrador. */
export async function hasOrderAccess(order: { code: string; userId: string | null }): Promise<boolean> {
  if ((await lastAccessedOrder()) === order.code) return true;
  const user = await getCurrentUser();
  return Boolean(user && (user.role === "admin" || user.id === order.userId));
}

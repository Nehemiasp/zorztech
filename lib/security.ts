import { createHmac, randomBytes, timingSafeEqual, createHash } from "node:crypto";

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production") throw new Error("Falta AUTH_SECRET");
    return "desarrollo-no-usar-en-produccion";
  }
  return value;
}

/** Firma HMAC-SHA256 en hexadecimal, con una clave derivada de AUTH_SECRET y un propósito. */
export function sign(purpose: string, data: string): string {
  return createHmac("sha256", `${secret()}:${purpose}`).update(data).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifySignature(purpose: string, data: string, signature: string): boolean {
  return safeEqual(sign(purpose, data), signature);
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Defensa contra CSRF en rutas de API que cambian datos: el origen de la petición debe ser el del sitio.
 * Las cookies además son SameSite=Lax y las rutas solo aceptan JSON.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

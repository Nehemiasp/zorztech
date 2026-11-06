import { safeEqual, sign } from "../security";
import { siteConfig } from "../site";

/**
 * Enlace directo a un pedido: lleva una firma que solo el servidor puede generar, así que sirve para ver
 * ese pedido sin iniciar sesión (por ejemplo, desde el correo). Solo da acceso a ese pedido.
 */
export const orderToken = (code: string) => sign("pedido-enlace", code).slice(0, 32);

export function validOrderToken(code: string, token: string | null | undefined): boolean {
  if (!token || token.length !== 32) return false;
  return safeEqual(orderToken(code), token);
}

export const orderViewUrl = (code: string) => `${siteConfig.url}/pedido/${encodeURIComponent(code)}/confirmacion?t=${orderToken(code)}`;

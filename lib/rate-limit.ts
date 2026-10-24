/**
 * Límite de peticiones por clave en memoria. Frena abusos básicos (intentos de adivinar códigos, correos
 * de recuperación en cadena). En un entorno con varias instancias cada una cuenta por su lado: para
 * un límite global habría que moverlo a Redis o a la base de datos.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  // Solo para las pruebas de punta a punta, que crean decenas de pedidos desde una misma IP. Nunca en producción.
  if (process.env.RATE_LIMIT_OFF === "1") return true;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  return true;
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "desconocida";
}

import { NextResponse } from "next/server";
import type { z } from "zod";
import { isSameOrigin } from "./security";

const noStore = { "Cache-Control": "no-store" };

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: noStore });
}

export const apiError = (message: string, status = 400, extra: Record<string, unknown> = {}) =>
  json({ error: message, ...extra }, status);

/**
 * Lee y valida el cuerpo JSON de una petición que cambia datos.
 * Rechaza orígenes ajenos (CSRF) y cuerpos que no cumplen el esquema.
 */
export async function readBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; response: NextResponse }> {
  if (!isSameOrigin(request)) return { ok: false, response: apiError("Origen no permitido.", 403) };
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: apiError("La solicitud no es válida.") };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, response: apiError("Revisa los datos e inténtalo de nuevo.", 422, { fields: fieldErrors(parsed.error) }) };
  }
  return { ok: true, data: parsed.data };
}

/** Errores por campo: { "email": "Escribe un correo válido." } */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    fields[key] ??= issue.message;
  }
  return fields;
}

/** Para rutas sin cuerpo (DELETE, acciones simples): solo comprueba el origen. */
export function checkOrigin(request: Request): NextResponse | null {
  return isSameOrigin(request) ? null : apiError("Origen no permitido.", 403);
}

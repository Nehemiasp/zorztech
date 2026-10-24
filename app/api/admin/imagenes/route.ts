import { apiError, json } from "@/lib/api";
import { adminUser } from "@/lib/admin/guard";
import { isSameOrigin } from "@/lib/security";
import { saveImage } from "@/lib/storage";

/** Sube una imagen desde el panel. Solo administradores; se comprueba tipo real, tamaño y origen. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origen no permitido.", 403);
  if (!(await adminUser())) return apiError("No tienes permiso para subir imágenes.", 403);

  const form = await request.formData().catch(() => null);
  const file = form?.get("archivo");
  if (!(file instanceof File)) return apiError("Elige una imagen para subir.", 422);

  const result = await saveImage(file);
  return result.ok ? json({ url: result.url }) : apiError(result.message, 422);
}

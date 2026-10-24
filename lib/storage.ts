import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" } as const;
export type ImageType = keyof typeof extensions;

/** Tipo real de la imagen según sus primeros bytes. El tipo que declara el navegador no se toma en cuenta. */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (bytes.length >= 12 && ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return "image/avif";
  return null;
}

const LOCAL_DIR = path.join(process.cwd(), ".uploads");
const LOCAL_NAME = /^[a-f0-9]{24}\.(jpg|png|webp|avif)$/;

export const isLocalUploadName = (name: string) => LOCAL_NAME.test(name);

export type SaveResult = { ok: true; url: string } | { ok: false; message: string };

/**
 * Guarda una imagen subida desde el panel. En producción va a Vercel Blob; en desarrollo, sin token,
 * se guarda en .uploads/ y se sirve desde /api/uploads.
 */
export async function saveImage(file: File): Promise<SaveResult> {
  if (file.size === 0) return { ok: false, message: "El archivo está vacío." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, message: "La imagen pesa más de 5 MB. Redúcela e inténtalo de nuevo." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) return { ok: false, message: "Sube una imagen JPG, PNG, WebP o AVIF." };
  const name = `${randomBytes(12).toString("hex")}.${extensions[type]}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`productos/${name}`, Buffer.from(bytes), { access: "public", contentType: type, addRandomSuffix: false });
    return { ok: true, url: blob.url };
  }
  // Sin Blob solo se guarda en disco en desarrollo, o si se pide a propósito (pruebas contra la compilación).
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_UPLOADS !== "1") {
    return { ok: false, message: "Falta configurar el almacenamiento de imágenes (BLOB_READ_WRITE_TOKEN)." };
  }
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DIR, name), bytes);
  return { ok: true, url: `/api/uploads/${name}` };
}

export async function readLocalUpload(name: string): Promise<{ data: Buffer; type: ImageType } | null> {
  if (!LOCAL_NAME.test(name)) return null;
  try {
    const data = await readFile(path.join(LOCAL_DIR, name));
    const type = detectImageType(data);
    return type ? { data, type } : null;
  } catch {
    return null;
  }
}

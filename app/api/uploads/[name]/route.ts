import { NextResponse } from "next/server";
import { readLocalUpload } from "@/lib/storage";

/** Sirve las imágenes subidas en desarrollo (sin Vercel Blob). Solo acepta nombres generados por la tienda. */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const file = await readLocalUpload((await params).name);
  if (!file) return new NextResponse("No encontrada", { status: 404 });
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

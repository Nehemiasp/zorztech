import { NextResponse } from "next/server";
import { z } from "zod";
import { suggest, type Suggestions } from "@/lib/catalog/listing";

const query = z.object({ q: z.string().trim().max(60) });
const empty: Suggestions = { productos: [], categorias: [] };

export async function GET(request: Request) {
  const parsed = query.safeParse({ q: new URL(request.url).searchParams.get("q") ?? "" });
  if (!parsed.success) return NextResponse.json({ error: "Búsqueda no válida" }, { status: 400 });

  // Con menos de dos letras no se sugiere nada: sería ruido.
  const result = parsed.data.q.length < 2 ? empty : await suggest(parsed.data.q);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}

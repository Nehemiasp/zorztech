import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/security";
import { expireStaleReservations } from "@/lib/orders/expiry";

/** Cron de Vercel: expira los pedidos sin pagar cuya reserva venció y devuelve su stock. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const sent = request.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(sent, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const expired = await expireStaleReservations();
  return NextResponse.json({ expired });
}

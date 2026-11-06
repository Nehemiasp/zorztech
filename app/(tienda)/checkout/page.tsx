import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { getCurrentUser } from "@/lib/auth";
import { getCartView } from "@/lib/cart/service";
import { db } from "@/lib/db";
import { getPaymentMethods } from "@/lib/payments";
import { listAvailablePickups } from "@/lib/pickup";
import { loadShipping } from "@/lib/settings";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const [cart, user] = await Promise.all([getCartView(), getCurrentUser()]);
  if (cart.lines.length === 0) redirect("/carrito");

  const [shipping, pickups, addresses] = await Promise.all([
    loadShipping(),
    listAvailablePickups(),
    user
      ? db.address.findMany({
          where: { userId: user.id },
          orderBy: [{ esPredeterminada: "desc" }, { id: "asc" }],
          select: { id: true, nombre: true, telefono: true, departamento: true, municipio: true, direccion: true, referencia: true },
        })
      : [],
  ]);

  return (
    <CheckoutFlow
      cart={cart}
      shipping={shipping}
      pickups={pickups}
      addresses={addresses.map((a) => ({ ...a, referencia: a.referencia ?? "" }))}
      methods={getPaymentMethods()}
      user={user ? { name: user.name, email: user.email, phone: user.phone ?? "" } : null}
    />
  );
}

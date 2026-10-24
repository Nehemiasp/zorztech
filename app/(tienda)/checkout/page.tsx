import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { getCurrentUser } from "@/lib/auth";
import { getCartView } from "@/lib/cart/service";
import { db } from "@/lib/db";
import { getPaymentMethods } from "@/lib/payments";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const [cart, user] = await Promise.all([getCartView(), getCurrentUser()]);
  if (cart.lines.length === 0) redirect("/carrito");

  const [rates, pickups, addresses] = await Promise.all([
    db.shippingRate.findMany({ orderBy: { departamento: "asc" }, select: { departamento: true, price: true, estimatedDays: true } }),
    db.pickupLocation.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, address: true, hours: true } }),
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
      rates={rates}
      pickups={pickups}
      addresses={addresses.map((a) => ({ ...a, referencia: a.referencia ?? "" }))}
      methods={getPaymentMethods()}
      user={user ? { name: user.name, email: user.email, phone: user.phone ?? "" } : null}
    />
  );
}

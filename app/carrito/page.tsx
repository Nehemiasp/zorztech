import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CartPageView } from "@/components/cart/cart-page-view";
import { getCartView } from "@/lib/cart/service";

export const metadata: Metadata = { title: "Tu carrito", robots: { index: false, follow: false } };

export default async function CartPage() {
  const cart = await getCartView();
  return (
    <div className="mx-auto max-w-page px-4 py-6 md:px-6 md:py-8">
      <Breadcrumbs items={[{ name: "Inicio", href: "/" }, { name: "Carrito" }]} />
      <h1 className="mb-6 mt-4 text-2xl md:text-3xl">Tu carrito</h1>
      <CartPageView initial={cart} />
    </div>
  );
}

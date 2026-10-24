import { SessionProvider } from "next-auth/react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartStatus } from "@/components/cart/cart-status";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/** Envoltura de la tienda pública: encabezado, pie, carrito y sesión. El panel de administración tiene la suya. */
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <SiteHeader />
        <main id="contenido">{children}</main>
        <SiteFooter />
        <CartDrawer />
        <CartStatus />
      </CartProvider>
    </SessionProvider>
  );
}

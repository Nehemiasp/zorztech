"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { emptyCart, type CartView } from "@/lib/cart/types";

interface ActionResult {
  ok: boolean;
  message?: string;
}

interface CartContextValue {
  cart: CartView;
  /** Ya se consultó el carrito al menos una vez. */
  ready: boolean;
  busy: boolean;
  drawerOpen: boolean;
  /** Mensaje de la última acción (para la región en vivo y el cajón). */
  notice: string | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  add: (variantId: string, quantity: number, productName?: string) => Promise<ActionResult>;
  setQuantity: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  confirmPrices: () => Promise<void>;
  applyCoupon: (code: string) => Promise<ActionResult>;
  removeCoupon: () => Promise<void>;
  /** Sincroniza el estado con el carrito que la página ya cargó en el servidor. */
  hydrate: (cart: CartView) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart debe usarse dentro de CartProvider");
  return value;
}

async function request(url: string, init?: RequestInit): Promise<{ ok: boolean; cart?: CartView; notice?: string; error?: string }> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
    const data = (await res.json()) as { cart?: CartView; notice?: string; error?: string };
    return { ok: res.ok, ...data };
  } catch {
    return { ok: false, error: "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo." };
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [cart, setCart] = useState<CartView>(emptyCart);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const latest = useRef(0);

  // El carrito puede cambiar fuera de esta pestaña (pago aprobado, inicio de sesión): se consulta al navegar.
  useEffect(() => {
    const id = ++latest.current;
    request("/api/carrito").then((res) => {
      if (id === latest.current && res.cart) {
        setCart(res.cart);
        setReady(true);
      }
    });
  }, [pathname]);

  const apply = useCallback((res: Awaited<ReturnType<typeof request>>) => {
    if (res.cart) {
      latest.current++;
      setCart(res.cart);
      setReady(true);
    }
    setNotice(res.notice ?? null);
  }, []);

  const add = useCallback<CartContextValue["add"]>(
    async (variantId, quantity, productName) => {
      setBusy(true);
      const res = await request("/api/carrito/items", { method: "POST", body: JSON.stringify({ variantId, quantity }) });
      setBusy(false);
      if (!res.ok) {
        const message = res.error ?? "No pudimos agregar el producto. Inténtalo de nuevo.";
        setNotice(message);
        return { ok: false, message };
      }
      apply(res);
      setNotice(res.notice ?? (productName ? `Agregaste ${productName} al carrito.` : "Producto agregado al carrito."));
      setDrawerOpen(true);
      return { ok: true, message: res.notice };
    },
    [apply],
  );

  const setQuantity = useCallback<CartContextValue["setQuantity"]>(
    async (itemId, quantity) => {
      setBusy(true);
      apply(await request(`/api/carrito/items/${itemId}`, { method: "PATCH", body: JSON.stringify({ quantity }) }));
      setBusy(false);
    },
    [apply],
  );

  const remove = useCallback<CartContextValue["remove"]>(
    async (itemId) => {
      setBusy(true);
      apply(await request(`/api/carrito/items/${itemId}`, { method: "DELETE" }));
      setBusy(false);
    },
    [apply],
  );

  const confirmPrices = useCallback(async () => {
    setBusy(true);
    apply(await request("/api/carrito/confirmar-precios", { method: "POST" }));
    setBusy(false);
  }, [apply]);

  const applyCoupon = useCallback<CartContextValue["applyCoupon"]>(
    async (code) => {
      setBusy(true);
      const res = await request("/api/carrito/cupon", { method: "POST", body: JSON.stringify({ codigo: code }) });
      setBusy(false);
      if (!res.ok) return { ok: false, message: res.error ?? "No pudimos aplicar el cupón." };
      apply(res);
      return { ok: true };
    },
    [apply],
  );

  const removeCoupon = useCallback(async () => {
    setBusy(true);
    apply(await request("/api/carrito/cupon", { method: "DELETE" }));
    setBusy(false);
  }, [apply]);

  const hydrate = useCallback((initial: CartView) => {
    latest.current++;
    setCart(initial);
    setReady(true);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      ready,
      busy,
      drawerOpen,
      notice,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      add,
      setQuantity,
      remove,
      confirmPrices,
      applyCoupon,
      removeCoupon,
      hydrate,
    }),
    [cart, ready, busy, drawerOpen, notice, add, setQuantity, remove, confirmPrices, applyCoupon, removeCoupon, hydrate],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

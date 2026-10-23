"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { Logo } from "./logo";
import { SearchForm } from "./search-form";

interface Props {
  categories: { name: string; slug: string }[];
  cartCount: number;
}

const iconButton =
  "relative inline-flex size-11 items-center justify-center rounded-md text-text-on-dark transition-colors duration-150 ease-out hover:bg-surface-dark-raised active:bg-surface-dark-alt";

export function HeaderShell({ categories, cartCount }: Props) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDialogElement>(null);
  // La búsqueda móvil se abre "en" una ruta: al navegar a otra se considera cerrada.
  const [searchPath, setSearchPath] = useState<string | null>(null);
  const searchOpen = searchPath === pathname;

  // El encabezado persiste entre páginas: al navegar se cierra el menú.
  useEffect(() => {
    menuRef.current?.close();
  }, [pathname]);

  const cartLabel = cartCount > 0 ? `Carrito, ${cartCount} ${cartCount === 1 ? "producto" : "productos"}` : "Carrito vacío";

  const cartLink = (
    <Link href="/carrito" className={iconButton} aria-label={cartLabel}>
      <ShoppingCart aria-hidden size={22} strokeWidth={1.75} />
      {cartCount > 0 && (
        <span
          aria-hidden
          className="absolute right-0.5 top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-primary px-1 text-sm leading-5 text-brand-white"
        >
          {cartCount}
        </span>
      )}
    </Link>
  );

  return (
    <header className="zone-dark border-b border-border-on-dark bg-surface-dark text-text-on-dark">
      <div className="mx-auto flex h-16 max-w-page items-center gap-3 px-4 md:h-20 md:gap-6 md:px-6">
        <Link href="/" aria-label="ZorzTech, ir al inicio" className="shrink-0 rounded-sm">
          <Logo height={32} priority />
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <SearchForm className="max-w-2xl" />
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <button
            type="button"
            className={`${iconButton} md:hidden`}
            aria-expanded={searchOpen}
            aria-controls="busqueda-movil"
            onClick={() => setSearchPath(searchOpen ? null : pathname)}
          >
            {searchOpen ? <X aria-hidden size={22} strokeWidth={1.75} /> : <Search aria-hidden size={22} strokeWidth={1.75} />}
            <span className="sr-only">{searchOpen ? "Cerrar búsqueda" : "Buscar productos"}</span>
          </button>

          <Link
            href="/ingresar"
            className="hidden min-h-11 items-center gap-2 rounded-md px-3 text-base transition-colors duration-150 ease-out hover:bg-surface-dark-raised active:bg-surface-dark-alt md:inline-flex"
          >
            <User aria-hidden size={20} strokeWidth={1.75} />
            Ingresar
          </Link>

          {cartLink}

          <button type="button" className={`${iconButton} md:hidden`} onClick={() => menuRef.current?.showModal()}>
            <Menu aria-hidden size={22} strokeWidth={1.75} />
            <span className="sr-only">Abrir menú</span>
          </button>
        </div>
      </div>

      {searchOpen && (
        <div id="busqueda-movil" className="border-t border-border-on-dark px-4 py-3 md:hidden">
          <SearchForm autoFocus />
        </div>
      )}

      <nav aria-label="Categorías" className="hidden border-t border-border-on-dark md:block">
        <ul className="mx-auto flex max-w-page flex-wrap gap-x-1 px-6">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/categorias/${c.slug}`}
                className="inline-flex min-h-11 items-center px-3 text-base text-text-on-dark-muted transition-colors duration-150 ease-out hover:text-text-on-dark"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <dialog
        ref={menuRef}
        aria-label="Menú"
        className="zone-dark m-0 h-dvh max-h-none w-full max-w-none bg-surface-dark p-0 text-text-on-dark backdrop:bg-black/60 md:hidden"
      >
        <div className="flex h-16 items-center justify-between border-b border-border-on-dark px-4">
          <Logo height={32} />
          <button type="button" className={iconButton} onClick={() => menuRef.current?.close()}>
            <X aria-hidden size={22} strokeWidth={1.75} />
            <span className="sr-only">Cerrar menú</span>
          </button>
        </div>
        <nav aria-label="Menú principal" className="px-4 py-4">
          <ul>
            {categories.map((c) => (
              <li key={c.slug} className="border-b border-border-on-dark">
                <Link href={`/categorias/${c.slug}`} className="flex min-h-12 items-center text-lg">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-6 space-y-1 text-text-on-dark-muted">
            <li>
              <Link href="/ingresar" className="flex min-h-11 items-center gap-2">
                <User aria-hidden size={20} strokeWidth={1.75} />
                Ingresar o crear cuenta
              </Link>
            </li>
            <li>
              <Link href="/pedido/seguimiento" className="flex min-h-11 items-center">
                Seguir mi pedido
              </Link>
            </li>
          </ul>
        </nav>
      </dialog>
    </header>
  );
}

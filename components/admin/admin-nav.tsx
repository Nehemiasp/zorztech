"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const links = [
  { href: "/admin", label: "Resumen", exact: true },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/cupones", label: "Cupones" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Panel de administración" className="overflow-x-auto">
      <ul className="flex gap-1 lg:flex-col">
        {links.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <li key={l.href} className="shrink-0">
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-md px-3 transition-colors duration-150 ease-out",
                  active ? "bg-surface-dark-alt text-text-on-dark" : "text-text-on-light hover:bg-surface-light-alt",
                )}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

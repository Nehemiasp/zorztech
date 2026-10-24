"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const links = [
  { href: "/cuenta", label: "Resumen", exact: true },
  { href: "/cuenta/pedidos", label: "Mis pedidos" },
  { href: "/cuenta/direcciones", label: "Direcciones" },
  { href: "/cuenta/datos", label: "Mis datos" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Mi cuenta">
      <ul className="flex flex-wrap gap-1 border-b border-border">
        {links.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center border-b-2 px-3",
                  active ? "border-brand-primary font-medium" : "border-transparent text-text-muted hover:text-text-on-light",
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

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Suggestions } from "@/lib/catalog/listing";

interface Option {
  id: string;
  label: string;
  hint: string;
  href: string;
}

function toOptions(data: Suggestions, prefix: string): Option[] {
  return [
    ...data.productos.map((p, i) => ({
      id: `${prefix}-p${i}`,
      label: p.nombre,
      hint: p.categoria,
      href: `/productos/${p.slug}`,
    })),
    ...data.categorias.map((c, i) => ({
      id: `${prefix}-c${i}`,
      label: c.nombre,
      hint: "Categoría",
      href: `/categorias/${c.slug}`,
    })),
  ];
}

/** Buscador con sugerencias (patrón combobox): funciona con teclado y también envía el formulario sin JavaScript. */
export function SearchForm({ className, autoFocus = false }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const uid = useId();
  const inputId = `${uid}-busqueda`;
  const listId = `${uid}-sugerencias`;
  const box = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/buscar/sugerencias?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) return;
        setOptions(toOptions((await res.json()) as Suggestions, uid));
        setActive(-1);
      } catch {
        // Sin sugerencias no pasa nada: el formulario sigue funcionando.
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, uid]);

  const visible = open && value.trim().length >= 2 && options.length > 0;

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (options.length === 0) return;
      e.preventDefault();
      setOpen(true);
      const delta = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (delta === 1 ? (i + 1) % options.length : i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Enter" && visible && active >= 0) {
      e.preventDefault();
      go(options[active].href);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <form action="/buscar" method="get" role="search" className={cn("flex w-full", className)}>
      <div
        ref={box}
        className="relative min-w-0 flex-1"
        onBlur={(e) => {
          if (!box.current?.contains(e.relatedTarget)) setOpen(false);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Buscar productos
        </label>
        <input
          id={inputId}
          name="q"
          type="search"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="Buscar productos"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={visible}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={visible && active >= 0 ? options[active].id : undefined}
          className="min-h-11 w-full rounded-l-md border border-r-0 border-border-strong-on-dark bg-surface-dark-alt px-4 text-base text-text-on-dark placeholder:text-text-on-dark-muted"
        />
        <ul
          id={listId}
          role="listbox"
          aria-label="Sugerencias"
          hidden={!visible}
          className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-md border border-border bg-surface-light text-text-on-light shadow-lg"
        >
          {options.map((o, i) => (
            <li
              key={o.id}
              id={o.id}
              role="option"
              aria-selected={i === active}
              // Evita que el campo pierda el foco antes de registrar el clic.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(o.href)}
              className={cn(
                "flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-2",
                i === active ? "bg-surface-light-alt" : "hover:bg-surface-light-alt",
              )}
            >
              <span>{o.label}</span>
              <span className="shrink-0 text-sm text-text-muted">{o.hint}</span>
            </li>
          ))}
        </ul>
        <p className="sr-only" aria-live="polite">
          {visible ? `${options.length} sugerencias. Usa las flechas para recorrerlas.` : ""}
        </p>
      </div>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center gap-2 rounded-r-md bg-brand-primary px-4 font-medium text-brand-white transition-colors duration-150 ease-out hover:bg-brand-primary-strong active:bg-brand-primary-deep"
      >
        <Search aria-hidden size={20} strokeWidth={1.75} />
        <span className="hidden sm:inline">Buscar</span>
        <span className="sr-only sm:hidden">Buscar</span>
      </button>
    </form>
  );
}

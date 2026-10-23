import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

export function SearchForm({ className, autoFocus = false }: { className?: string; autoFocus?: boolean }) {
  return (
    <form action="/buscar" method="get" role="search" className={cn("flex w-full", className)}>
      <label htmlFor="busqueda" className="sr-only">
        Buscar productos
      </label>
      <input
        id="busqueda"
        name="q"
        type="search"
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder="Buscar productos"
        className="min-h-11 min-w-0 flex-1 rounded-l-md border border-r-0 border-border-strong-on-dark bg-surface-dark-alt px-4 text-base text-text-on-dark placeholder:text-text-on-dark-muted"
      />
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

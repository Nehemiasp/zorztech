"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";

/** Hoja inferior con los filtros en móvil. En escritorio los filtros van en un panel lateral. */
export function FiltersSheet({ activeCount, children }: { activeCount: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const search = useSearchParams().toString();

  // Al aplicar filtros cambia la URL: la hoja se cierra y se ven los resultados.
  useEffect(() => {
    ref.current?.close();
  }, [pathname, search]);

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={buttonStyles("secondary-light", "lg:hidden")}>
        <SlidersHorizontal aria-hidden size={20} strokeWidth={1.75} />
        Filtros{activeCount > 0 && ` (${activeCount})`}
      </button>

      <dialog
        ref={ref}
        aria-label="Filtros"
        className="m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-lg bg-surface-light p-0 text-text-on-light backdrop:bg-black/50 lg:hidden"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface-light px-4 py-2">
          <h2 className="text-lg">Filtros</h2>
          <button type="button" onClick={() => ref.current?.close()} className="inline-flex size-11 items-center justify-center rounded-md hover:bg-surface-light-alt">
            <X aria-hidden size={22} strokeWidth={1.75} />
            <span className="sr-only">Cerrar filtros</span>
          </button>
        </div>
        <div className="px-4 pt-4">{children}</div>
      </dialog>
    </>
  );
}

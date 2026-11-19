"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";

export interface ProofItem {
  src: string;
  /** Texto bajo la miniatura, por ejemplo la fecha de subida. */
  meta?: string;
}

/**
 * Comprobantes de transferencia en una ventana sobre la página, sin abrir otra pestaña.
 * «thumbs» muestra miniaturas (panel); «links» muestra enlaces de texto (cliente).
 */
export function ProofViewer({ items, variant = "links" }: { items: ProofItem[]; variant?: "thumbs" | "links" }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  if (items.length === 0) return null;

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const step = (delta: number) => setIndex((i) => (i + delta + items.length) % items.length);
  const current = items[index];
  const iconButton =
    "inline-flex size-11 items-center justify-center rounded-full bg-surface-light text-text-on-light transition-colors duration-150 ease-out hover:bg-surface-light-alt";

  return (
    <>
      {variant === "thumbs" ? (
        <ul className="mt-2 flex flex-wrap gap-3">
          {items.map((item, i) => (
            <li key={item.src}>
              <button type="button" onClick={() => open(i)} className="group block text-left">
                {/* eslint-disable-next-line @next/next/no-img-element -- imagen privada servida por la API, sin optimizador */}
                <img src={item.src} alt="" width={120} height={160} className="h-40 w-30 rounded-sm border border-border object-cover transition-opacity duration-150 group-hover:opacity-90" />
                <span className="mt-1 block text-sm text-brand-primary-strong underline underline-offset-2">Ver comprobante {i + 1}</span>
                {item.meta && <span className="block text-sm text-text-muted">{item.meta}</span>}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-3 space-y-1">
          {items.map((item, i) => (
            <li key={item.src}>
              <button type="button" onClick={() => open(i)} className="inline-flex min-h-11 items-center text-brand-primary-strong underline underline-offset-2">
                Ver comprobante {i + 1}
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialog}
        aria-label={`Comprobante ${index + 1} de ${items.length}`}
        onKeyDown={(e) => {
          if (items.length < 2) return;
          if (e.key === "ArrowLeft") step(-1);
          if (e.key === "ArrowRight") step(1);
        }}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="zone-dark motion-fade m-auto max-h-[96dvh] w-[min(96vw,52rem)] max-w-none rounded-lg bg-surface-dark-alt p-3 text-text-on-dark backdrop:bg-black/80 sm:p-4"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 pl-1">
            <p className="font-medium">
              Comprobante {index + 1} de {items.length}
              {current.meta && <span className="font-normal text-text-on-dark-muted"> · {current.meta}</span>}
            </p>
            <button type="button" onClick={() => dialog.current?.close()} className={iconButton} autoFocus>
              <X aria-hidden size={22} />
              <span className="sr-only">Cerrar</span>
            </button>
          </div>

          <div className="relative flex h-[min(72dvh,40rem)] items-center justify-center overflow-hidden rounded-md bg-surface-dark">
            {/* eslint-disable-next-line @next/next/no-img-element -- imagen privada servida por la API, sin optimizador */}
            <img src={current.src} alt={`Comprobante ${index + 1}`} className="size-full object-contain" />
            {items.length > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} className={`${iconButton} absolute left-2 shadow-md`}>
                  <ChevronLeft aria-hidden size={22} />
                  <span className="sr-only">Comprobante anterior</span>
                </button>
                <button type="button" onClick={() => step(1)} className={`${iconButton} absolute right-2 shadow-md`}>
                  <ChevronRight aria-hidden size={22} />
                  <span className="sr-only">Comprobante siguiente</span>
                </button>
              </>
            )}
          </div>

          <p className="text-center">
            <a href={current.src} target="_blank" rel="noopener noreferrer" className={buttonStyles("secondary-dark", "gap-2")}>
              <ExternalLink aria-hidden size={18} />
              Abrir en tamaño original
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          </p>
        </div>
      </dialog>
    </>
  );
}

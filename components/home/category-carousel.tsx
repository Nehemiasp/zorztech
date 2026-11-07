"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Lista de tarjetas que en móvil es un carrusel (se desliza con el dedo, con paradas en cada tarjeta y flechas)
 * y desde tablet es una cuadrícula. Las tarjetas llegan ya armadas desde el servidor.
 */
export function CategoryCarousel({ label, children }: { label: string; children: React.ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    el.addEventListener("scroll", update, { passive: true });
    // El observador avisa al montar y cada vez que cambia el ancho (giro de pantalla, tamaño de ventana).
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  const go = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  };

  const arrow =
    "inline-flex size-11 items-center justify-center rounded-full border border-border-strong bg-surface-light text-text-on-light transition-colors duration-150 ease-out hover:bg-surface-light-alt disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div>
      <div
        ref={scroller}
        role="region"
        aria-label={`${label}: desliza para ver más`}
        tabIndex={0}
        className="-mx-4 snap-x snap-mandatory overflow-x-auto scroll-px-4 px-4 [scrollbar-width:none] md:mx-0 md:snap-none md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex gap-4 md:grid md:grid-cols-3 md:gap-x-6 md:gap-y-8 lg:grid-cols-6">{children}</ul>
      </div>
      <div className="mt-4 flex justify-end gap-2 md:hidden">
        <button type="button" onClick={() => go(-1)} disabled={edges.start} className={arrow}>
          <ChevronLeft aria-hidden size={20} />
          <span className="sr-only">Categorías anteriores</span>
        </button>
        <button type="button" onClick={() => go(1)} disabled={edges.end} className={arrow}>
          <ChevronRight aria-hidden size={20} />
          <span className="sr-only">Más categorías</span>
        </button>
      </div>
    </div>
  );
}

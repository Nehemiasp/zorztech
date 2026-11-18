"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Fila del inicio (categorías o productos): título, enlace «Ver todo» opcional y una tira que se desliza
 * en horizontal (con el dedo, con la rueda o con las flechas). Las tarjetas llegan ya armadas desde el servidor.
 */
export function Rail({
  id,
  title,
  href,
  anchor,
  children,
}: {
  id: string;
  title: string;
  href?: string;
  /** id de la sección para enlazarla con #ancla. */
  anchor?: string;
  children: React.ReactNode;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    el.addEventListener("scroll", update, { passive: true });
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
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: reduce ? "auto" : "smooth" });
  };

  const arrow =
    "inline-flex size-10 items-center justify-center rounded-full border border-border-strong bg-surface-light text-text-on-light transition-colors duration-250 ease-out hover:bg-surface-light-alt disabled:cursor-not-allowed disabled:opacity-40";
  const scrollable = !(edges.start && edges.end);

  return (
    <section id={anchor} aria-labelledby={`${id}-titulo`} className="scroll-mt-4 bg-surface-light">
      <div className="mx-auto max-w-page px-4 py-6 md:px-6 md:py-8">
        <div className="flex items-center justify-between gap-4">
          <h2 id={`${id}-titulo`} className="text-lg md:text-xl">
            {title}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            {href && (
              <Link
                href={href}
                className="inline-flex min-h-11 items-center gap-1 rounded-sm px-1 font-medium text-brand-primary underline-offset-2 hover:underline"
              >
                Ver todo
                <span className="sr-only"> en {title}</span>
                <ChevronRight aria-hidden size={16} />
              </Link>
            )}
            {scrollable && (
              <div className="hidden gap-2 md:flex">
                <button type="button" onClick={() => go(-1)} disabled={edges.start} className={arrow}>
                  <ChevronLeft aria-hidden size={20} />
                  <span className="sr-only">Anteriores en {title}</span>
                </button>
                <button type="button" onClick={() => go(1)} disabled={edges.end} className={arrow}>
                  <ChevronRight aria-hidden size={20} />
                  <span className="sr-only">Más en {title}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          ref={scroller}
          role="region"
          aria-label={`${title}: desliza para ver más`}
          tabIndex={0}
          className="-mx-4 mt-5 snap-x snap-mandatory overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:px-0 [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex gap-4 md:gap-6">{children}</ul>
        </div>
      </div>
    </section>
  );
}


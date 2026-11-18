"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Hace que las secciones de la página entren con un fundido suave al llegar a ellas con el scroll.
 * Solo anima lo que todavía no se ve: lo que ya está en pantalla al cargar se queda quieto (sin parpadeos
 * y sin retrasar la imagen principal). Sin JavaScript o con «reducir movimiento», todo se ve normal.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const main = document.querySelector("main");
    if (!main) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.04 },
    );

    const prepare = () => {
      // Solo las secciones de primer nivel (y lo marcado con data-reveal), para no animar lo mismo dos veces.
      const candidates = main.querySelectorAll<HTMLElement>("section, [data-reveal]");
      for (const el of candidates) {
        if (el.dataset.revealSeen) continue;
        el.dataset.revealSeen = "";
        if (el.parentElement?.closest("main section, main [data-reveal]")) continue;
        if (el.getBoundingClientRect().top < window.innerHeight) continue;
        el.classList.add("reveal");
        observer.observe(el);
      }
    };

    prepare();
    // Lo que llega después (contenido que se transmite por partes o que se carga al filtrar) también entra suave.
    let frame = 0;
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(prepare);
    });
    mutations.observe(main, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      observer.disconnect();
      // Si la vista cambia antes de llegar a una sección, que no se quede oculta.
      for (const el of main.querySelectorAll(".reveal:not(.is-revealed)")) el.classList.add("is-revealed");
    };
  }, [pathname]);

  return null;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { CatalogImage } from "@/components/catalog-image";
import { cn } from "@/lib/cn";

export interface GalleryImage {
  url: string;
  alt: string;
}

const control =
  "inline-flex size-11 items-center justify-center rounded-md bg-surface-light/90 text-text-on-light transition-colors duration-150 ease-out hover:bg-surface-light";

/**
 * Galería: las imágenes se deslizan con el dedo (scroll con anclaje) y las miniaturas llevan a cada una.
 * Tocar o pulsar una imagen la abre en grande.
 */
export function Gallery({ images }: { images: GalleryImage[] }) {
  const track = useRef<HTMLDivElement>(null);
  const zoom = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [zoomIndex, setZoomIndex] = useState(0);

  const goTo = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setIndex(Math.round(el.scrollLeft / el.clientWidth)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const openZoom = (i: number) => {
    setZoomIndex(i);
    zoom.current?.showModal();
  };
  const step = (delta: number) => setZoomIndex((i) => (i + delta + images.length) % images.length);

  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse">
      <div className="min-w-0 flex-1">
        <div
          ref={track}
          tabIndex={0}
          role="group"
          aria-roledescription="carrusel"
          aria-label={`Fotos del producto, ${index + 1} de ${images.length}`}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-md bg-surface-light-alt [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, i) => (
            <div key={image.url + i} className="relative aspect-square w-full shrink-0 snap-center">
              <CatalogImage
                src={image.url}
                alt={image.alt}
                width={900}
                height={900}
                priority={i === 0}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => openZoom(i)}
                className={cn(control, "absolute bottom-3 right-3")}
              >
                <ZoomIn aria-hidden size={22} strokeWidth={1.75} />
                <span className="sr-only">Ampliar foto {i + 1}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto lg:w-20 lg:shrink-0 lg:flex-col lg:overflow-visible" aria-label="Miniaturas">
          {images.map((image, i) => (
            <li key={image.url + i} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "block size-14 overflow-hidden rounded-sm border-2 bg-surface-light-alt lg:size-20",
                  i === index ? "border-brand-primary" : "border-transparent hover:border-border-strong",
                )}
              >
                <CatalogImage src={image.url} alt="" width={160} height={160} className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={zoom}
        aria-label="Foto ampliada"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") step(-1);
          if (e.key === "ArrowRight") step(1);
        }}
        className="m-auto max-h-[96dvh] w-[min(96vw,60rem)] max-w-none bg-transparent p-0 backdrop:bg-black/80"
      >
        <div className="relative">
          <CatalogImage
            src={images[zoomIndex].url}
            alt={images[zoomIndex].alt}
            width={1400}
            height={1400}
            sizes="96vw"
            className="mx-auto max-h-[90dvh] w-auto rounded-md bg-surface-light object-contain"
          />
          <button type="button" onClick={() => zoom.current?.close()} className={cn(control, "absolute right-3 top-3")}>
            <X aria-hidden size={22} strokeWidth={1.75} />
            <span className="sr-only">Cerrar foto</span>
          </button>
          {images.length > 1 && (
            <>
              <button type="button" onClick={() => step(-1)} className={cn(control, "absolute left-3 top-1/2 -translate-y-1/2")}>
                <ChevronLeft aria-hidden size={22} strokeWidth={1.75} />
                <span className="sr-only">Foto anterior</span>
              </button>
              <button type="button" onClick={() => step(1)} className={cn(control, "absolute right-3 top-1/2 -translate-y-1/2")}>
                <ChevronRight aria-hidden size={22} strokeWidth={1.75} />
                <span className="sr-only">Foto siguiente</span>
              </button>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}

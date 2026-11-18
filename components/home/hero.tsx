import { getImageProps } from "next/image";
import { LinkButton } from "@/components/ui/button";
import type { getHero } from "@/lib/settings";

/**
 * Banner principal del inicio, como tarjeta dentro del ancho de la página.
 * Desde 640 px usa la imagen horizontal con el texto sobre su zona oscura (izquierda).
 * En celular, si hay versión vertical, el texto va sobre su parte alta; si no, el texto va arriba y la imagen debajo.
 */
export function Hero({ hero, className }: { hero: Awaited<ReturnType<typeof getHero>>; className?: string }) {
  const tall = hero.imageMobile;
  const base = { alt: hero.image.alt, fill: true, priority: true, quality: 80, sizes: "(min-width: 1024px) 66vw, 100vw" } as const;
  const wide = getImageProps({ ...base, src: hero.image.src }).props;
  const narrow = tall ? getImageProps({ ...base, sizes: "100vw", src: tall.src }).props : null;

  return (
    <section
      aria-labelledby="hero-titulo"
      className={`zone-dark relative isolate flex flex-col overflow-hidden rounded-lg bg-surface-dark text-text-on-dark sm:aspect-[1584/672] sm:justify-center ${
        tall ? "aspect-[1116/2000] justify-start" : ""
      } ${className ?? ""}`}
    >
      <div
        className={`${tall ? "absolute inset-0" : "relative order-last aspect-[16/9]"} -z-10 sm:absolute sm:inset-0 sm:order-none sm:aspect-auto`}
      >
        <picture>
          {narrow && <source media="(max-width: 639px)" srcSet={narrow.srcSet} sizes="100vw" />}
          <img {...wide} alt={hero.image.alt} className="object-cover object-right" />
        </picture>
        {/* Oscurece solo el lado del texto para que se lea aunque la imagen cambie */}
        <div className="absolute inset-0 hidden bg-linear-to-r from-surface-dark/75 via-surface-dark/30 via-45% to-transparent to-70% sm:block" />
      </div>

      <div className="relative p-6 sm:max-w-[54%] sm:p-8 lg:max-w-[56%]">
        <h1
          id="hero-titulo"
          className="hero-step text-2xl sm:text-xl xl:text-2xl"
          style={{ "--step": 0 } as React.CSSProperties}
        >
          {hero.title}
        </h1>
        <p
          className="hero-step mt-3 text-text-on-dark-muted sm:hidden"
          style={{ "--step": 1 } as React.CSSProperties}
        >
          {hero.body}
        </p>
        <div className="hero-step mt-5 flex flex-wrap gap-3" style={{ "--step": 2 } as React.CSSProperties}>
          <LinkButton href={hero.primaryCta.href}>{hero.primaryCta.label}</LinkButton>
          <LinkButton href={hero.secondaryCta.href} variant="secondary-dark">
            {hero.secondaryCta.label}
          </LinkButton>
        </div>
      </div>
    </section>
  );
}

import { getImageProps } from "next/image";
import { LinkButton } from "@/components/ui/button";
import type { getHero } from "@/lib/settings";

/**
 * Banner del inicio. En escritorio (1280 px en adelante) la imagen horizontal es el fondo del hero y el
 * texto va sobre su zona oscura; en pantallas medianas el texto queda arriba y el banner completo debajo.
 * En celular, si hay versión vertical, es el fondo y el texto va sobre su parte alta; si no, se usa la horizontal.
 */
export function Hero({ hero }: { hero: Awaited<ReturnType<typeof getHero>> }) {
  const tall = hero.imageMobile;
  const base = { alt: hero.image.alt, fill: true, priority: true, quality: 80, sizes: "100vw" } as const;
  const wide = getImageProps({ ...base, src: hero.image.src }).props;
  const narrow = tall ? getImageProps({ ...base, src: tall.src }).props : null;

  return (
    <section
      aria-labelledby="hero-titulo"
      className="zone-dark relative isolate flex flex-col overflow-hidden bg-surface-dark text-text-on-dark xl:min-h-[34rem] xl:justify-center"
    >
      <div className={`relative z-10 mx-auto w-full max-w-page px-4 pt-12 md:px-6 xl:py-16 ${tall ? "pb-[93vw] sm:pb-8" : "pb-8"}`}>
        <div className="xl:max-w-[32rem]">
          <h1 id="hero-titulo" className="hero-step text-2xl md:text-3xl lg:text-4xl" style={{ "--step": 0 } as React.CSSProperties}>
            {hero.title}
          </h1>
          <p
            className="hero-step mt-5 max-w-[34rem] text-lg text-text-on-dark-muted xl:max-w-[28rem]"
            style={{ "--step": 1 } as React.CSSProperties}
          >
            {hero.body}
          </p>
          <div className="hero-step mt-8 flex flex-wrap gap-3" style={{ "--step": 2 } as React.CSSProperties}>
            <LinkButton href={hero.primaryCta.href}>{hero.primaryCta.label}</LinkButton>
            <LinkButton href={hero.secondaryCta.href} variant="secondary-dark">
              {hero.secondaryCta.label}
            </LinkButton>
          </div>
        </div>
      </div>

      <div
        className={
          tall
            ? "hero-banner hero-banner-tall absolute inset-x-0 bottom-0 aspect-[1116/2000] sm:relative sm:inset-auto sm:aspect-[5/2] xl:absolute xl:inset-0 xl:-z-10 xl:aspect-auto"
            : "hero-banner relative aspect-[16/9] w-full md:aspect-[5/2] xl:absolute xl:inset-0 xl:-z-10 xl:aspect-auto"
        }
      >
        <picture>
          {narrow && <source media="(max-width: 639px)" srcSet={narrow.srcSet} sizes="100vw" />}
          <img {...wide} alt={hero.image.alt} className="object-cover object-right" />
        </picture>
      </div>
    </section>
  );
}

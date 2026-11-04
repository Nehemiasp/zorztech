import { CatalogImage } from "@/components/catalog-image";
import { LinkButton } from "@/components/ui/button";
import type { getHero } from "@/lib/settings";

/**
 * Banner horizontal (5:2). En escritorio la imagen es el fondo del hero y el texto va sobre su zona oscura;
 * en pantallas chicas el texto queda arriba y el banner completo debajo, sin tapar el producto.
 */
export function Hero({ hero }: { hero: Awaited<ReturnType<typeof getHero>> }) {
  return (
    <section
      aria-labelledby="hero-titulo"
      className="zone-dark relative isolate flex flex-col overflow-hidden bg-surface-dark text-text-on-dark xl:min-h-[34rem] xl:justify-center"
    >
      <div className="relative z-10 mx-auto w-full max-w-page px-4 pb-8 pt-12 md:px-6 xl:py-16">
        <div className="xl:max-w-[32rem]">
          <h1 id="hero-titulo" className="hero-step text-2xl md:text-3xl lg:text-4xl" style={{ "--step": 0 } as React.CSSProperties}>
            {hero.title}
          </h1>
          <p
            className="hero-step mt-5 max-w-[34rem] text-lg xl:max-w-[28rem] text-text-on-dark-muted"
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

      <div className="hero-banner relative aspect-[16/9] w-full md:aspect-[5/2] xl:absolute xl:inset-0 xl:-z-10 xl:aspect-auto">
        <CatalogImage
          src={hero.image.src}
          alt={hero.image.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-right"
        />
      </div>
    </section>
  );
}

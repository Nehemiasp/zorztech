import { CatalogImage } from "@/components/catalog-image";
import { LinkButton } from "@/components/ui/button";
import type { getHero } from "@/lib/settings";

export function Hero({ hero }: { hero: Awaited<ReturnType<typeof getHero>> }) {
  return (
    <section
      aria-labelledby="hero-titulo"
      className="zone-dark relative isolate overflow-hidden bg-surface-dark text-text-on-dark"
    >
      {/* Diagonal de la "Z" del logotipo: el único recurso gráfico de la marca en el sitio */}
      <div aria-hidden className="hero-slant absolute inset-y-0 right-0 hidden w-[58%] lg:block" />

      <div className="relative mx-auto grid max-w-page items-center gap-y-8 px-4 pt-12 md:px-6 lg:min-h-[34rem] lg:grid-cols-12 lg:gap-x-8 lg:py-16">
        <div className="lg:col-span-6">
          <h1 id="hero-titulo" className="hero-step text-2xl md:text-3xl lg:text-4xl" style={{ "--step": 0 } as React.CSSProperties}>
            {hero.title}
          </h1>
          <p
            className="hero-step mt-5 max-w-[34rem] text-lg text-text-on-dark-muted"
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

        <div className="hero-visual hero-panel-in -mx-4 md:-mx-6 lg:col-span-5 lg:col-start-8 lg:mx-0">
          <div className="hero-glow mx-auto w-full max-w-[22rem] py-10 lg:max-w-[28rem] lg:py-0">
            <CatalogImage
              src={hero.image.src}
              alt={hero.image.alt}
              width={900}
              height={900}
              priority
              sizes="(min-width: 1024px) 28rem, 22rem"
              className="aspect-square w-full rounded-lg object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <section className="zone-dark relative isolate overflow-hidden bg-surface-dark text-text-on-dark">
      <div aria-hidden className="hero-slant absolute inset-y-0 right-0 hidden w-[45%] md:block" />
      <div className="relative mx-auto max-w-page px-4 py-20 md:px-6 md:py-28">
        <p className="font-display text-4xl text-brand-accent" aria-hidden>
          404
        </p>
        <h1 className="mt-4 text-2xl md:text-3xl">No encontramos esa página</h1>
        <p className="mt-4 max-w-[34rem] text-lg text-text-on-dark-muted">
          La dirección puede estar mal escrita o la página ya no existe. Busca el producto o vuelve al inicio.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="/">Ir al inicio</LinkButton>
          <LinkButton href="/#categorias" variant="secondary-dark">
            Ver categorías
          </LinkButton>
        </div>
      </div>
    </section>
  );
}

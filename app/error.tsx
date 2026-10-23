"use client";

import { buttonStyles, LinkButton } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="mx-auto max-w-page px-4 py-20 md:px-6 md:py-28">
      <h1 className="text-2xl md:text-3xl">No pudimos cargar esta página</h1>
      <p className="mt-4 max-w-[34rem] text-lg text-text-muted">
        Fue un problema de nuestro lado. Inténtalo de nuevo en unos segundos; si sigue igual, vuelve al inicio.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className={buttonStyles("primary")}>
          Intentar de nuevo
        </button>
        <LinkButton href="/" variant="secondary-light">
          Ir al inicio
        </LinkButton>
      </div>
    </section>
  );
}

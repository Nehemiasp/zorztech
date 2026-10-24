import { Breadcrumbs } from "@/components/breadcrumbs";
import { Marker } from "@/components/marker";

/** Estructura común de las páginas de información: migas de pan, un título y texto con largo de línea cómodo. */
export function InfoPage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-page px-4 py-6 md:px-6 md:py-10">
      <Breadcrumbs items={[{ name: "Inicio", href: "/" }, { name: title }]} />
      <h1 className="mt-4 text-2xl md:text-3xl">{title}</h1>
      {intro && <p className="mt-3 max-w-[65ch] text-lg text-text-muted">{intro}</p>}
      <div className="mt-8 max-w-[65ch] space-y-8">{children}</div>
    </div>
  );
}

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl">{title}</h2>
      <div className="mt-3 space-y-3 text-text-muted">{children}</div>
    </section>
  );
}

/** Texto que debe entregar el dueño. Se ve como marcador, con una nota de qué va ahí. */
export function PolicyPlaceholder({ marker, hint }: { marker: string; hint: string }) {
  return (
    <p>
      <Marker>{marker}</Marker>
      <span className="mt-1 block text-sm">{hint}</span>
    </p>
  );
}

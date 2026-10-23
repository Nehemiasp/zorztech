import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { jsonLd } from "@/lib/jsonld";
import { siteConfig } from "@/lib/site";

export interface Crumb {
  name: string;
  href?: string;
}

/** Ruta de navegación visible y datos estructurados BreadcrumbList. El último elemento es la página actual. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const structured = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.href ? { item: `${siteConfig.url}${item.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="Ruta de navegación">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <ol className="flex flex-wrap items-center gap-x-1 text-sm text-text-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.name}-${i}`} className="flex items-center gap-x-1">
              {item.href && !last ? (
                <Link href={item.href} className="inline-flex min-h-8 items-center rounded-sm underline-offset-2 hover:text-text-on-light hover:underline">
                  {item.name}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "text-text-on-light" : undefined}>
                  {item.name}
                </span>
              )}
              {!last && <ChevronRight aria-hidden size={14} strokeWidth={1.75} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

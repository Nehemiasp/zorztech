import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface Props {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}

/** Páginas visibles: la primera, la última y las vecinas a la actual. */
function visiblePages(page: number, pageCount: number): (number | "gap")[] {
  const wanted = new Set([1, pageCount, page - 1, page, page + 1]);
  const pages = [...wanted].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  pages.forEach((n, i) => {
    if (i > 0 && n - pages[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

const item = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 transition-colors duration-150 ease-out";

export function Pagination({ page, pageCount, hrefFor }: Props) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Paginación" className="mt-10 flex flex-wrap items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={cn(item, "gap-1 hover:bg-surface-light-alt")}>
          <ChevronLeft aria-hidden size={18} strokeWidth={1.75} />
          Anterior
        </Link>
      ) : null}
      {visiblePages(page, pageCount).map((n, i) =>
        n === "gap" ? (
          <span key={`gap-${i}`} aria-hidden className="px-1 text-text-muted">
            …
          </span>
        ) : (
          <Link
            key={n}
            href={hrefFor(n)}
            aria-label={`Página ${n}`}
            aria-current={n === page ? "page" : undefined}
            className={cn(item, n === page ? "bg-surface-dark-alt text-text-on-dark" : "hover:bg-surface-light-alt")}
          >
            {n}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} rel="next" className={cn(item, "gap-1 hover:bg-surface-light-alt")}>
          Siguiente
          <ChevronRight aria-hidden size={18} strokeWidth={1.75} />
        </Link>
      ) : null}
    </nav>
  );
}

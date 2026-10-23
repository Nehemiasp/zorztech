/** Esqueleto mientras se cargan los resultados. Los bloques repiten la forma de las tarjetas. */
export function ListingSkeleton() {
  return (
    <div className="mx-auto max-w-page px-4 py-8 md:px-6" role="status" aria-live="polite">
      <span className="sr-only">Cargando productos</span>
      <div className="h-4 w-48 animate-pulse rounded-sm bg-surface-light-alt" />
      <div className="mt-4 h-9 w-72 animate-pulse rounded-sm bg-surface-light-alt" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-md bg-surface-light-alt" />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <div className="aspect-square animate-pulse rounded-md bg-surface-light-alt" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded-sm bg-surface-light-alt" />
              <div className="mt-2 h-5 w-1/3 animate-pulse rounded-sm bg-surface-light-alt" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

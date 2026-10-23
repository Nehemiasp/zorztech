export default function Loading() {
  return (
    <div className="mx-auto max-w-page px-4 py-8 md:px-6" role="status" aria-live="polite">
      <span className="sr-only">Cargando producto</span>
      <div className="h-4 w-64 animate-pulse rounded-sm bg-surface-light-alt" />
      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="aspect-square animate-pulse rounded-md bg-surface-light-alt" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 animate-pulse rounded-sm bg-surface-light-alt" />
          <div className="h-8 w-1/3 animate-pulse rounded-sm bg-surface-light-alt" />
          <div className="h-24 animate-pulse rounded-md bg-surface-light-alt" />
          <div className="h-11 animate-pulse rounded-md bg-surface-light-alt" />
        </div>
      </div>
    </div>
  );
}

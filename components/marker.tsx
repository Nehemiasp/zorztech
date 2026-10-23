/** Dato pendiente que debe entregar el dueño de la tienda. Se ve a propósito para que no pase a producción. */
export function Marker({ children }: { children: React.ReactNode }) {
  return <span className="marker">{children}</span>;
}

"use client";

import { useEffect, useState } from "react";

// Pasa a true después de la primera vista de la sesión (la que mide la velocidad de carga).
let afterFirstView = false;

/**
 * Fundido corto al cambiar de página dentro de la tienda. La carga inicial no se anima, para no
 * retrasar la imagen principal (LCP); en las siguientes vistas el contenido aparece con suavidad.
 */
export function PageEnter({ children }: { children: React.ReactNode }) {
  const [animate] = useState(() => typeof window !== "undefined" && afterFirstView);
  useEffect(() => {
    afterFirstView = true;
  }, []);
  return <div className={animate ? "page-enter" : undefined}>{children}</div>;
}

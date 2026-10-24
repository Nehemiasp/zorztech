import type { Metadata } from "next";
import { NotFoundContent } from "@/components/not-found-content";
import StorefrontLayout from "./(tienda)/layout";

export const metadata: Metadata = { title: "Página no encontrada", robots: { index: false } };

// Una dirección que no existe en ningún grupo de rutas: se muestra con el encabezado y el pie de la tienda.
export default function NotFound() {
  return (
    <StorefrontLayout>
      <NotFoundContent />
    </StorefrontLayout>
  );
}

import type { Metadata } from "next";
import { InfoPage, InfoSection, PolicyPlaceholder } from "@/components/info/info-page";

export const metadata: Metadata = {
  title: "Términos y condiciones de compra",
  description: "Las condiciones que aplican al comprar en ZorzTech: precios, pagos, entregas, cambios y responsabilidades.",
  alternates: { canonical: "/terminos" },
};

export default function TermsPage() {
  return (
    <InfoPage title="Términos y condiciones" intro="Estas son las condiciones que aceptas al comprar en esta tienda.">
      <InfoSection title="Texto legal">
        <PolicyPlaceholder
          marker="[Términos y condiciones del cliente]"
          hint="Texto que redacta el dueño de la tienda con su asesor legal: identificación del vendedor, precios e impuestos, pagos, entregas, cambios y devoluciones, límites de responsabilidad y ley aplicable."
        />
      </InfoSection>
    </InfoPage>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection, PolicyPlaceholder } from "@/components/info/info-page";

export const metadata: Metadata = {
  title: "Garantías de los productos",
  description: "Qué cubre la garantía de los productos que compras en ZorzTech, por cuánto tiempo y qué hacer si algo falla.",
  alternates: { canonical: "/garantias" },
};

export default function WarrantyPage() {
  return (
    <InfoPage title="Garantías" intro="Aquí vas a encontrar cuánto dura la garantía de cada tipo de producto y cómo hacerla valer.">
      <InfoSection title="Cuánto dura">
        <PolicyPlaceholder marker="[Duración de la garantía por tipo de producto]" hint="Por ejemplo, por categoría o por marca, con el plazo en meses." />
      </InfoSection>
      <InfoSection title="Qué cubre y qué no">
        <PolicyPlaceholder marker="[Qué cubre la garantía y qué la anula]" hint="Defectos de fábrica, daños por uso, accesorios, software." />
      </InfoSection>
      <InfoSection title="Cómo reclamarla">
        <PolicyPlaceholder marker="[Pasos para reclamar una garantía]" hint="Qué documentos llevar, dónde presentarlos y en cuánto tiempo se responde." />
        <p>
          Mientras tanto, para cualquier duda sobre un producto que ya compraste, escríbenos desde{" "}
          <Link href="/contacto" className="text-brand-primary-strong underline underline-offset-2">
            Contacto
          </Link>{" "}
          con el código de tu pedido.
        </p>
      </InfoSection>
    </InfoPage>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection, PolicyPlaceholder } from "@/components/info/info-page";

export const metadata: Metadata = {
  title: "Devoluciones y reembolsos",
  description: "Cuánto tiempo tienes para devolver un producto, en qué condiciones y cómo se te devuelve el dinero.",
  alternates: { canonical: "/devoluciones" },
};

export default function ReturnsPage() {
  return (
    <InfoPage title="Devoluciones y reembolsos" intro="Si algo no salió como esperabas, aquí está el camino para devolverlo.">
      <InfoSection title="Plazo y condiciones">
        <PolicyPlaceholder marker="[Política de devoluciones del cliente]" hint="Cuántos días hay para devolver, estado en que debe estar el producto y qué productos no admiten devolución." />
      </InfoSection>
      <InfoSection title="Cómo pedir una devolución">
        <PolicyPlaceholder marker="[Pasos para pedir una devolución]" hint="A dónde escribir, qué datos enviar y quién paga el envío de regreso." />
      </InfoSection>
      <InfoSection title="Cómo se te devuelve el dinero">
        <PolicyPlaceholder marker="[Forma y plazo del reembolso]" hint="Por el mismo medio de pago, en cuántos días." />
        <p>
          Cuando registramos un reembolso, el estado de tu pedido cambia a «Reembolsado» y recibes un correo. Puedes verlo en{" "}
          <Link href="/pedido/seguimiento" className="text-brand-primary-strong underline underline-offset-2">
            el seguimiento de tu pedido
          </Link>
          .
        </p>
      </InfoSection>
    </InfoPage>
  );
}

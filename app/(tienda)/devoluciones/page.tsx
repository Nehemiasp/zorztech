import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/info/info-page";

export const metadata: Metadata = {
  title: "Devoluciones y reembolsos",
  description: "Cómo pedir un cambio o una devolución en ZorzTech y en qué condiciones se atiende.",
  alternates: { canonical: "/devoluciones" },
};

const link = "text-brand-primary-strong underline underline-offset-2";

// Sección 6 («Cambios y devoluciones») de los términos y condiciones entregados por el dueño (18 de noviembre de 2026).
const conditions = [
  "Toda solicitud de cambio o devolución deberá comunicarse directamente a ZorzTech.",
  "El producto deberá conservar sus accesorios y empaques originales cuando corresponda.",
  "Los cambios o devoluciones estarán sujetos a la evaluación del caso y a las disposiciones legales aplicables.",
  "Los productos con fallas de fábrica serán atendidos conforme a las condiciones de garantía y los derechos del consumidor.",
  "No se considerarán automáticamente como defectos de fábrica los daños ocasionados por mal uso o manipulación inadecuada.",
];

export default function ReturnsPage() {
  return (
    <InfoPage title="Devoluciones y reembolsos" intro="Si algo no salió como esperabas, aquí está el camino para pedir un cambio o una devolución.">
      <InfoSection title="Cambios y devoluciones">
        <ul className="list-disc space-y-1 pl-5">
          {conditions.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p>
          Estas condiciones forman parte de nuestros{" "}
          <Link href="/terminos" className={link}>
            términos y condiciones
          </Link>
          . Si el producto tiene una falla, revisa también{" "}
          <Link href="/garantias" className={link}>
            Garantías
          </Link>
          .
        </p>
      </InfoSection>
      <InfoSection title="Cómo pedirlo">
        <p>
          Escríbenos desde{" "}
          <Link href="/contacto" className={link}>
            Contacto
          </Link>{" "}
          con el código de tu pedido y cuéntanos qué pasó.
        </p>
        <p>
          Cuando registramos un reembolso, el estado de tu pedido cambia a «Reembolsado» y recibes un correo. Puedes verlo en{" "}
          <Link href="/pedido/seguimiento" className={link}>
            el seguimiento de tu pedido
          </Link>
          .
        </p>
      </InfoSection>
    </InfoPage>
  );
}

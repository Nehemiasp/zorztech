import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/info/info-page";
import { Marker } from "@/components/marker";
import { contactOrMarker, getStoreSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Contacto y horario de atención",
  description: "Cómo comunicarte con ZorzTech: teléfono, correo y horario de atención para dudas sobre productos y pedidos.",
  alternates: { canonical: "/contacto" },
};

export default async function ContactPage() {
  const contact = contactOrMarker((await getStoreSettings()).contact);
  const show = (item: { value: string; pending: boolean }) => (item.pending ? <Marker>{item.value}</Marker> : item.value);

  return (
    <InfoPage title="Contacto" intro="Escríbenos o llámanos para dudas sobre un producto o un pedido. Ten a la mano el código de tu pedido si ya compraste.">
      <InfoSection title="Cómo encontrarnos">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[10rem_1fr]">
          <dt className="font-medium text-text-on-light">Teléfono</dt>
          <dd>{contact.phone.pending ? show(contact.phone) : <a href={`tel:${contact.phone.value.replace(/[^+\d]/g, "")}`} className="text-brand-primary-strong underline underline-offset-2">{contact.phone.value}</a>}</dd>
          <dt className="font-medium text-text-on-light">Correo</dt>
          <dd>{contact.email.pending ? show(contact.email) : <a href={`mailto:${contact.email.value}`} className="text-brand-primary-strong underline underline-offset-2">{contact.email.value}</a>}</dd>
          <dt className="font-medium text-text-on-light">Horario</dt>
          <dd>{show(contact.hours)}</dd>
          <dt className="font-medium text-text-on-light">Redes</dt>
          <dd>{show(contact.socials)}</dd>
        </dl>
      </InfoSection>
      <InfoSection title="Antes de escribir">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Para saber dónde va tu pedido, usa{" "}
            <Link href="/pedido/seguimiento" className="text-brand-primary-strong underline underline-offset-2">el seguimiento</Link>.
          </li>
          <li>
            Las respuestas más comunes están en{" "}
            <Link href="/preguntas-frecuentes" className="text-brand-primary-strong underline underline-offset-2">preguntas frecuentes</Link>.
          </li>
        </ul>
      </InfoSection>
    </InfoPage>
  );
}

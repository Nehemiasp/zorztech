import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/info/info-page";
import { Marker } from "@/components/marker";
import { listAvailablePickups } from "@/lib/pickup";
import { formatGTQ } from "@/lib/money";
import { loadShipping } from "@/lib/settings";
import { asSentence } from "@/lib/shipping";

export const metadata: Metadata = {
  title: "Envíos",
  description: "Costo del envío a domicilio, envío gratis desde cierto monto de compra y tiempo de entrega en todo el país.",
  alternates: { canonical: "/envios" },
};

const isMarker = (text: string) => text.startsWith("[");

export default async function ShippingPage() {
  const [shipping, pickups] = await Promise.all([loadShipping(), listAvailablePickups()]);
  const freeShipping = shipping.freeFrom > 0;

  return (
    <InfoPage
      title="Envíos"
      intro={pickups.length > 0 ? "Puedes recibir tu pedido en casa o recogerlo en tienda. El costo del envío lo ves antes de pagar." : "Enviamos a todo el país. El costo del envío lo ves antes de pagar."}
    >
      <InfoSection title="Envío a domicilio">
        <p>Llevamos tu pedido a la dirección que indiques en el pago, en cualquier departamento. Cuando sale de la tienda te avisamos por correo.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Costo del envío: <strong className="font-medium text-text-on-light">{shipping.flatRate === 0 ? "gratis" : formatGTQ(shipping.flatRate)}</strong>, el mismo para todo el país.
          </li>
          {freeShipping && shipping.flatRate > 0 && (
            <li>
              Envío gratis en compras de <strong className="font-medium text-text-on-light">{formatGTQ(shipping.freeFrom)}</strong> o más, ya con descuentos aplicados.
            </li>
          )}
          <li>Tiempo de entrega: {shipping.deliveryTime ? asSentence(shipping.deliveryTime) : <Marker>[Tiempo de entrega]</Marker>}</li>
        </ul>
      </InfoSection>

      {pickups.length > 0 && (
        <InfoSection title="Recogida en tienda">
          <p>No tiene costo. Te escribimos cuando tu pedido está listo para que pases por él.</p>
          <ul className="space-y-3">
            {pickups.map((p) => (
              <li key={p.id}>
                <span className="font-medium text-text-on-light">{p.name}</span>
                <br />
                {p.address}
                <br />
                Horario: {isMarker(p.hours) ? <Marker>{p.hours}</Marker> : p.hours}
              </li>
            ))}
          </ul>
        </InfoSection>
      )}

      <p>
        ¿Ya compraste?{" "}
        <Link href="/pedido/seguimiento" className="text-brand-primary-strong underline underline-offset-2">
          Sigue tu pedido con su código y tu correo
        </Link>
        .
      </p>
    </InfoPage>
  );
}

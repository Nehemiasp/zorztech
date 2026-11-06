import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection, PolicyPlaceholder } from "@/components/info/info-page";
import { Marker } from "@/components/marker";
import { db } from "@/lib/db";
import { formatGTQ } from "@/lib/money";
import { loadShipping } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Envíos y recogida en tienda",
  description: "Costo del envío a domicilio, envío gratis desde cierto monto de compra y dónde recoger tu pedido sin costo.",
  alternates: { canonical: "/envios" },
};

const isMarker = (text: string) => text.startsWith("[");

export default async function ShippingPage() {
  const [shipping, pickups] = await Promise.all([
    loadShipping(),
    db.pickupLocation.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);
  const freeShipping = shipping.freeFrom > 0;

  return (
    <InfoPage title="Envíos y recogida en tienda" intro="Puedes recibir tu pedido en casa o recogerlo en tienda. El costo del envío lo ves antes de pagar.">
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
          <li>
            Tiempo de entrega: {shipping.deliveryTime ? shipping.deliveryTime : <Marker>[Tiempo de entrega]</Marker>}
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="Recogida en tienda">
        <p>No tiene costo. Te escribimos cuando tu pedido está listo para que pases por él.</p>
        {pickups.length === 0 ? (
          <p>Por ahora no hay tiendas para recoger.</p>
        ) : (
          <ul className="space-y-3">
            {pickups.map((p) => (
              <li key={p.id}>
                <span className="font-medium text-text-on-light">{p.name}</span>
                <br />
                {isMarker(p.address) ? <Marker>{p.address}</Marker> : p.address}
                <br />
                Horario: {isMarker(p.hours) ? <Marker>{p.hours}</Marker> : p.hours}
              </li>
            ))}
          </ul>
        )}
      </InfoSection>

      <InfoSection title="Condiciones de entrega">
        <PolicyPlaceholder
          marker="[Política de envíos del cliente]"
          hint="Cobertura, zonas de difícil acceso, qué pasa si no hay nadie para recibir el pedido y cómo se maneja un paquete dañado."
        />
      </InfoSection>

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

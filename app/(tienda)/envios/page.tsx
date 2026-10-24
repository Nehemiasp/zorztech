import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection, PolicyPlaceholder } from "@/components/info/info-page";
import { Marker } from "@/components/marker";
import { db } from "@/lib/db";
import { formatGTQ } from "@/lib/money";

export const metadata: Metadata = {
  title: "Envíos y recogida en tienda",
  description: "Costo y tiempo de entrega a domicilio según tu departamento, y dónde recoger tu pedido sin costo. Consulta las tarifas antes de pagar.",
  alternates: { canonical: "/envios" },
};

const isMarker = (text: string) => text.startsWith("[");

export default async function ShippingPage() {
  const [rates, pickups] = await Promise.all([
    db.shippingRate.findMany({ orderBy: { departamento: "asc" } }),
    db.pickupLocation.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <InfoPage title="Envíos y recogida en tienda" intro="Puedes recibir tu pedido en casa o recogerlo en tienda. El costo se calcula antes de pagar, según tu departamento.">
      <InfoSection title="Envío a domicilio">
        <p>Llevamos tu pedido a la dirección que indiques en el pago. Cuando sale de la tienda te avisamos por correo.</p>
        {rates.length === 0 ? (
          <p>Todavía no hay tarifas cargadas. Mientras tanto, la recogida en tienda está disponible.</p>
        ) : (
          <div className="relative overflow-x-auto" role="region" aria-label="Tarifas de envío por departamento" tabIndex={0}>
            <table className="w-full min-w-[19rem] text-left">
              <caption className="sr-only">Costo y tiempo de entrega por departamento</caption>
              <thead className="border-b border-border text-sm">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-medium">Departamento</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Costo</th>
                  <th scope="col" className="py-2 text-right font-medium">Entrega</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => (
                  <tr key={r.id} className="border-b border-border">
                    <th scope="row" className="py-2 pr-4 font-normal text-text-on-light">{r.departamento}</th>
                    <td className="py-2 pr-4 text-right tabular-nums">{r.price === 0 ? "Gratis" : formatGTQ(r.price)}</td>
                    <td className="py-2 text-right tabular-nums">{r.estimatedDays} {r.estimatedDays === 1 ? "día" : "días"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p>Si tu departamento no aparece en la lista, por ahora solo puedes elegir la recogida en tienda.</p>
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

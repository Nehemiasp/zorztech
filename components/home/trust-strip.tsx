import { CreditCard, Headset, PackageSearch, Truck } from "lucide-react";
import { Marker } from "@/components/marker";
import { contactOrMarker, getStoreSettings } from "@/lib/settings";

/**
 * Franja «Compra con tranquilidad». En escritorio, una fila con el título a la izquierda y cuatro columnas;
 * en celular y tablet, el título arriba y una cuadrícula de 2 × 2 con textos más cortos.
 */
export async function TrustStrip() {
  const contact = contactOrMarker((await getStoreSettings()).contact);
  const show = (item: { value: string; pending: boolean }) => (item.pending ? <Marker>{item.value}</Marker> : item.value);

  const items = [
    {
      icon: Truck,
      title: "Entrega",
      long: "Envío a todo el país con una sola tarifa. Gratis en compras grandes.",
      short: "A todo el país, una sola tarifa. Gratis en compras grandes.",
    },
    {
      icon: PackageSearch,
      title: "Seguimiento",
      long: "Consulta tu pedido con su código y tu correo, sin crear una cuenta.",
      short: "Con tu código y correo, sin crear una cuenta.",
    },
    {
      icon: CreditCard,
      title: "Pago",
      long: <>Pagas en quetzales: {show(contact.paymentMethods)}.</>,
      short: <>{show(contact.paymentMethods)}, en quetzales.</>,
    },
    {
      icon: Headset,
      title: "Atención",
      long: <>Escríbenos antes o después de comprar, de {show(contact.hours)}.</>,
      short: <>Escríbenos de {show(contact.hours)}.</>,
    },
  ];

  return (
    <section aria-labelledby="confianza-titulo" className="mx-auto max-w-page px-4 py-4 md:px-6">
      <div className="rounded-lg border border-border bg-surface-light p-5 md:p-6 lg:grid lg:grid-cols-[1.1fr_repeat(4,1fr)] lg:items-start lg:p-8">
        <div className="lg:self-center lg:pr-8">
          <h2 id="confianza-titulo" className="text-xl md:text-2xl">
            Compra con tranquilidad
          </h2>
          <p className="mt-2 text-text-muted">
            Sabes qué pagas y cuándo llega<span className="hidden lg:inline">, desde el primer clic</span>.
          </p>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 md:gap-4 lg:contents">
          {items.map(({ icon: Icon, title, long, short }) => (
            <div
              key={title}
              className="rounded-lg bg-surface-light-alt p-4 lg:rounded-none lg:border-l lg:border-border lg:bg-transparent lg:px-5 lg:py-1"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-surface-tint text-brand-primary lg:size-11">
                <Icon aria-hidden size={20} strokeWidth={1.75} />
              </span>
              <dt className="mt-3 font-semibold lg:text-lg">{title}</dt>
              <dd className="mt-1 text-sm text-text-muted">
                <span className="lg:hidden">{short}</span>
                <span className="hidden lg:inline">{long}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

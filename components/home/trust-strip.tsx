import { CreditCard, Headset, PackageSearch, Truck } from "lucide-react";
import { Marker } from "@/components/marker";
import { trust } from "@/lib/content/home";
import { contactOrMarker, getStoreSettings } from "@/lib/settings";

const icons = { Entrega: Truck, Seguimiento: PackageSearch, Pago: CreditCard, Atención: Headset } as const;

export async function TrustStrip() {
  const contact = contactOrMarker((await getStoreSettings()).contact);
  return (
    <section aria-labelledby="confianza-titulo" className="mx-auto max-w-page px-4 py-4 md:px-6">
      <h2 id="confianza-titulo" className="sr-only">
        Cómo funciona tu compra
      </h2>
      <dl className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {trust.map((item) => {
          const Icon = icons[item.title];
          return (
            <div key={item.title} className="flex gap-4 bg-surface-light p-5">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-tint text-brand-primary-strong">
                <Icon aria-hidden size={22} strokeWidth={1.75} />
              </span>
              <div>
                <dt className="font-semibold">{item.title}</dt>
                <dd className="mt-1 text-sm text-text-muted">
                  {item.body}
                  {"pending" in item && (
                    <>
                      {" "}
                      {contact[item.pending].pending ? <Marker>{contact[item.pending].value}</Marker> : contact[item.pending].value}
                    </>
                  )}
                </dd>
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

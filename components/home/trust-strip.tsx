import { Marker } from "@/components/marker";
import { trust } from "@/lib/content/home";
import { pendingData } from "@/lib/site";

export function TrustStrip() {
  return (
    <section aria-labelledby="confianza-titulo" className="border-y border-border bg-surface-light-alt">
      <div className="mx-auto max-w-page px-4 py-10 md:px-6">
        <h2 id="confianza-titulo" className="sr-only">
          Cómo funciona tu compra
        </h2>
        <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {trust.map((item) => (
            <div key={item.title} className="lg:border-l lg:border-border lg:px-6 lg:first:border-l-0 lg:first:pl-0">
              <dt className="text-lg font-medium">{item.title}</dt>
              <dd className="mt-2 max-w-[36ch] text-text-muted">
                {item.body}
                {"pending" in item && (
                  <>
                    {" "}
                    <Marker>{pendingData[item.pending]}</Marker>
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

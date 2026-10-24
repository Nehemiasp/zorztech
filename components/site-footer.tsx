import Link from "next/link";
import { getNavCategories } from "@/lib/catalog/cards";
import { contactOrMarker, getStoreSettings } from "@/lib/settings";
import { siteConfig } from "@/lib/site";
import { Logo } from "./logo";
import { Marker } from "./marker";

const infoLinks = [
  { href: "/envios", label: "Envíos" },
  { href: "/garantias", label: "Garantías" },
  { href: "/devoluciones", label: "Devoluciones" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
  { href: "/pedido/seguimiento", label: "Seguir mi pedido" },
  { href: "/contacto", label: "Contacto" },
];

const legalLinks = [
  { href: "/terminos", label: "Términos y condiciones" },
  { href: "/privacidad", label: "Privacidad" },
];

const linkClass = "inline-flex min-h-11 items-center text-text-on-dark-muted transition-colors duration-150 ease-out hover:text-text-on-dark";

export async function SiteFooter() {
  const [categories, settings] = await Promise.all([getNavCategories(), getStoreSettings()]);
  const contact = contactOrMarker(settings.contact);
  const show = (item: { value: string; pending: boolean }) => (item.pending ? <Marker>{item.value}</Marker> : item.value);

  return (
    <footer className="zone-dark bg-surface-dark-alt text-text-on-dark">
      <div className="mx-auto grid max-w-page gap-10 px-4 py-12 md:grid-cols-2 md:px-6 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <Logo height={32} />
          <p className="mt-4 max-w-xs text-text-on-dark-muted">
            Tecnología para comprar en línea y recibir en casa o recoger en tienda.
          </p>
        </div>

        <nav aria-label="Categorías del pie de página">
          <h2 className="text-lg">Categorías</h2>
          <ul className="mt-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/categorias/${c.slug}`} className={linkClass}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Información">
          <h2 className="text-lg">Información</h2>
          <ul className="mt-2">
            {infoLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-lg">Contacto</h2>
          <ul className="mt-3 space-y-2 text-text-on-dark-muted">
            <li>{contact.phone.pending ? show(contact.phone) : <a href={`tel:${contact.phone.value.replace(/[^+\d]/g, "")}`} className="underline underline-offset-2">{contact.phone.value}</a>}</li>
            <li>{contact.email.pending ? show(contact.email) : <a href={`mailto:${contact.email.value}`} className="underline underline-offset-2">{contact.email.value}</a>}</li>
            <li>{show(contact.hours)}</li>
            <li>{show(contact.socials)}</li>
          </ul>
          <h2 className="mt-6 text-lg">Formas de pago</h2>
          <p className="mt-3 text-text-on-dark-muted">{show(contact.paymentMethods)}</p>
        </div>
      </div>

      <div className="border-t border-border-on-dark">
        <div className="mx-auto flex max-w-page flex-col gap-1 px-4 py-4 text-text-on-dark-muted md:flex-row md:items-center md:justify-between md:px-6">
          <p>© {new Date().getFullYear()} {siteConfig.name}</p>
          <ul className="flex flex-wrap gap-x-6">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

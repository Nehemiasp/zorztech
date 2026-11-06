import type { Metadata } from "next";
import { BannerForm, ContactForm, InventoryForm, PickupList, ShippingForm } from "@/components/admin/config-forms";
import { PageHeader, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { hero as defaultHero } from "@/lib/content/home";
import { db } from "@/lib/db";
import { centsToInput } from "@/lib/money";
import { getStoreSettings, loadShipping } from "@/lib/settings";

export const metadata: Metadata = { title: "Configuración" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [settings, shipping, pickups, banner] = await Promise.all([
    getStoreSettings(),
    loadShipping(),
    db.pickupLocation.findMany({ orderBy: { name: "asc" } }),
    db.banner.findFirst({ where: { slot: "hero" }, orderBy: { order: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Configuración" />
      <p className="mb-6 max-w-[65ch] text-text-muted">
        Aquí cargas los datos de tu tienda. Mientras un dato falte, el sitio muestra un marcador entre corchetes en su lugar.
      </p>
      <nav aria-label="Secciones de configuración" className="mb-8 flex flex-wrap gap-x-6">
        {[
          ["#contacto", "Contacto"],
          ["#banner", "Banner del inicio"],
          ["#envios", "Envío"],
          ["#tiendas", "Tiendas para recoger"],
          ["#inventario", "Inventario"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="inline-flex min-h-11 items-center text-brand-primary-strong underline underline-offset-2">
            {label}
          </a>
        ))}
      </nav>

      <div className="space-y-10">
        <Panel title="Datos de contacto" className="scroll-mt-4" >
          <span id="contacto" />
          <ContactForm contact={settings.contact} />
        </Panel>
        <Panel title="Banner del inicio">
          <span id="banner" />
          <BannerForm
            custom={Boolean(banner)}
            banner={{
              title: banner?.title ?? defaultHero.title,
              body: banner?.body ?? defaultHero.body,
              ctaLabel: banner?.ctaLabel ?? defaultHero.primaryCta.label,
              ctaHref: banner?.ctaHref ?? defaultHero.primaryCta.href,
              imageUrl: banner?.imageUrl ?? "",
              imageAlt: banner?.imageAlt ?? "",
              isActive: banner?.isActive ?? true,
            }}
          />
        </Panel>
        <Panel title="Envío">
          <span id="envios" />
          <ShippingForm
            flatRate={centsToInput(shipping.flatRate)}
            freeFrom={shipping.freeFrom > 0 ? centsToInput(shipping.freeFrom) : ""}
            deliveryTime={shipping.deliveryTime}
          />
        </Panel>
        <Panel title="Tiendas para recoger">
          <span id="tiendas" />
          <PickupList pickups={pickups} />
        </Panel>
        <Panel title="Inventario">
          <span id="inventario" />
          <InventoryForm lowStockDefault={settings.inventory.lowStockDefault} />
        </Panel>
      </div>
    </>
  );
}

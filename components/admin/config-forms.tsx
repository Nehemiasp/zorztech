"use client";

import { useActionState, useRef, useState } from "react";
import { Message } from "@/components/auth/forms";
import { CatalogImage } from "@/components/catalog-image";
import { buttonStyles } from "@/components/ui/button";
import { CheckboxField, TextAreaField, TextField } from "@/components/ui/field";
import {
  removePickupAction,
  resetBannerAction,
  saveBannerAction,
  saveContactAction,
  saveInventoryAction,
  savePickupAction,
  saveShippingAction,
  saveTransferAction,
} from "@/app/admin/configuracion/actions";
import type { FormState } from "@/lib/auth/actions";
import type { TransferSettings } from "@/lib/transfer";

type Form = [FormState, (payload: FormData) => void, boolean];
const useForm = (action: (prev: FormState, data: FormData) => Promise<FormState>): Form => useActionState<FormState, FormData>(action, {});

export function ContactForm({ contact }: { contact: { phone: string; email: string; hours: string; socials: string; paymentMethods: string } }) {
  const [state, action, pending] = useForm(saveContactAction);
  const v = (k: keyof typeof contact) => state.values?.[k] ?? contact[k];
  const e = state.fields ?? {};
  return (
    <form action={action} noValidate className="max-w-xl space-y-4">
      <Message state={state} />
      <p className="text-text-muted">Se muestran en el pie de la tienda y en la franja de confianza del inicio. Lo que dejes vacío se ve como marcador.</p>
      <TextField label="Teléfono" name="phone" type="tel" defaultValue={v("phone")} error={e.phone} />
      <TextField label="Correo de contacto" name="email" type="email" defaultValue={v("email")} error={e.email} />
      <TextField label="Horario de atención" name="hours" hint="Ejemplo: Lunes a sábado, de 9:00 a 18:00." defaultValue={v("hours")} error={e.hours} />
      <TextField label="Redes sociales" name="socials" hint="Ejemplo: Instagram @zorztech · Facebook /zorztech" defaultValue={v("socials")} error={e.socials} />
      <TextField label="Formas de pago aceptadas" name="paymentMethods" hint="Solo las confirmadas. Ejemplo: Tarjeta de crédito y débito." defaultValue={v("paymentMethods")} error={e.paymentMethods} />
      <button type="submit" disabled={pending} className={buttonStyles("primary")}>
        {pending ? "Guardando…" : "Guardar contacto"}
      </button>
    </form>
  );
}

export function InventoryForm({ lowStockDefault }: { lowStockDefault: number }) {
  const [state, action, pending] = useForm(saveInventoryAction);
  return (
    <form action={action} noValidate className="max-w-xl space-y-4">
      <Message state={state} />
      <TextField
        label="Mínimo de stock por defecto"
        name="lowStockDefault"
        type="number"
        min={0}
        hint="Al crear una variante nueva se propone este mínimo. Con esas unidades o menos, la ficha dice «Últimas unidades» y el resumen avisa."
        defaultValue={state.values?.lowStockDefault ?? String(lowStockDefault)}
        error={state.fields?.lowStockDefault}
      />
      <button type="submit" disabled={pending} className={buttonStyles("primary")}>
        {pending ? "Guardando…" : "Guardar mínimo"}
      </button>
    </form>
  );
}

interface BannerValues {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  imageAlt: string;
  isActive: boolean;
}

export function BannerForm({ banner, custom }: { banner: BannerValues; custom: boolean }) {
  const [state, action, pending] = useForm(saveBannerAction);
  const [resetState, resetAction, resetting] = useActionState<FormState>(resetBannerAction, {});
  const [image, setImage] = useState(state.values?.imageUrl ?? banner.imageUrl);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const v = (k: keyof BannerValues) => (state.values?.[k] ?? banner[k]) as string;
  const e = state.fields ?? {};

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const body = new FormData();
    body.set("archivo", file);
    try {
      const res = await fetch("/api/admin/imagenes", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) setImage(data.url);
      else setUploadError(data.error ?? "No se pudo subir la imagen.");
    } catch {
      setUploadError("No pudimos conectar. Inténtalo de nuevo.");
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <div className="max-w-xl space-y-4">
      <form action={action} noValidate className="space-y-4">
        <Message state={state} />
        <input type="hidden" name="imageUrl" value={image} />
        <TextField label="Titular" name="title" defaultValue={v("title")} error={e.title} />
        <TextAreaField label="Texto de apoyo" name="body" rows={3} defaultValue={v("body")} error={e.body} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Texto del botón" name="ctaLabel" defaultValue={v("ctaLabel")} error={e.ctaLabel} />
          <TextField label="A dónde lleva el botón" name="ctaHref" hint="Ejemplo: /categorias/audio" defaultValue={v("ctaHref")} error={e.ctaHref} />
        </div>
        <div>
          <p className="mb-1 font-medium">Imagen del banner (horizontal, 1600 × 640 px, proporción 5:2)</p>
          {image && (
            <div className="mb-2 aspect-[5/2] w-full max-w-sm overflow-hidden rounded-md bg-surface-light-alt">
              <CatalogImage src={image} alt="" width={640} height={256} className="size-full object-cover" />
            </div>
          )}
          <input ref={fileInput} id="imagen-banner" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(ev) => upload(ev.target.files?.[0])} />
          <label htmlFor="imagen-banner" className={`${buttonStyles("secondary-light")} cursor-pointer`}>
            {uploading ? "Subiendo…" : image ? "Cambiar foto" : "Subir foto"}
          </label>
          {uploadError && (
            <p role="alert" className="mt-2 text-state-error">
              {uploadError}
            </p>
          )}
          {e.imageUrl && <p className="mt-1 text-sm text-state-error">{e.imageUrl}</p>}
        </div>
        <TextField label="Descripción de la foto" name="imageAlt" hint="Para quien no puede verla." defaultValue={v("imageAlt")} error={e.imageAlt} />
        <CheckboxField label="Usar este banner en el inicio" hint="Si lo desmarcas, se usa el banner por defecto." name="isActive" defaultChecked={banner.isActive} />
        <button type="submit" disabled={pending || uploading} className={buttonStyles("primary")}>
          {pending ? "Guardando…" : "Guardar banner"}
        </button>
      </form>
      <Message state={resetState} />
      {custom && (
        <form action={resetAction} className="space-y-2 border-t border-border pt-4">
          <button type="submit" disabled={resetting} className={buttonStyles("secondary-light")}>
            Volver al banner por defecto
          </button>
        </form>
      )}
    </div>
  );
}

export function ShippingForm({ flatRate, freeFrom, deliveryTime }: { flatRate: string; freeFrom: string; deliveryTime: string }) {
  const [state, action, pending] = useForm(saveShippingAction);
  const e = state.fields ?? {};
  const v = (k: string, fallback: string) => state.values?.[k] ?? fallback;
  return (
    <form action={action} noValidate className="max-w-xl space-y-4">
      <Message state={state} />
      <p className="max-w-[65ch] text-text-muted">
        Una sola tarifa para todo el país, con IVA incluido. El envío gratis se aplica cuando la compra, ya con descuentos, llega al monto que pongas.
      </p>
      <TextField
        label="Costo del envío a domicilio (Q)"
        name="flatRate"
        inputMode="decimal"
        hint="Ejemplo: 55.00. Escribe 0 si el envío siempre es gratis."
        defaultValue={v("flatRate", flatRate)}
        error={e.flatRate}
      />
      <TextField
        label="Envío gratis desde (Q)"
        name="freeFrom"
        inputMode="decimal"
        hint="Ejemplo: 400.00. Déjalo en blanco si no ofreces envío gratis por monto."
        defaultValue={v("freeFrom", freeFrom)}
        error={e.freeFrom}
      />
      <TextField
        label="Tiempo de entrega"
        name="deliveryTime"
        hint="Texto libre, por ejemplo «1 a 2 días; puede variar según el lugar de envío». Mientras esté vacío, la tienda muestra un marcador."
        defaultValue={v("deliveryTime", deliveryTime)}
        error={e.deliveryTime}
      />
      <button type="submit" disabled={pending} className={buttonStyles("primary")}>
        {pending ? "Guardando…" : "Guardar envío"}
      </button>
    </form>
  );
}

export function TransferForm({ transfer }: { transfer: TransferSettings }) {
  const [state, action, pending] = useForm(saveTransferAction);
  const e = state.fields ?? {};
  const v = (k: keyof TransferSettings) => state.values?.[k] ?? String(transfer[k]);
  return (
    <form action={action} noValidate className="max-w-xl space-y-4">
      <Message state={state} />
      <p className="max-w-[65ch] text-text-muted">
        El cliente elige «Transferencia bancaria» en el pago, ve estos datos y deposita. El pedido queda pendiente: cuando veas el dinero en tu cuenta, entra al pedido y pulsa «Marcar como pagado».
      </p>
      <CheckboxField label="Ofrecer pago por transferencia" hint="Si lo desmarcas, la opción desaparece del pago. Tus datos se conservan." name="enabled" defaultChecked={transfer.enabled} />
      <TextField label="Banco" name="bankName" defaultValue={v("bankName")} error={e.bankName} />
      <TextField label="Titular de la cuenta" name="accountName" defaultValue={v("accountName")} error={e.accountName} />
      <TextField label="Número de cuenta" name="accountNumber" inputMode="numeric" defaultValue={v("accountNumber")} error={e.accountNumber} />
      <TextField label="Tipo de cuenta (opcional)" name="accountType" hint="Por ejemplo, Monetaria o Ahorro." defaultValue={v("accountType")} error={e.accountType} />
      <TextAreaField label="Indicaciones para el cliente (opcional)" name="instructions" rows={3} hint="Por ejemplo, a qué hora se acreditan las transferencias." defaultValue={v("instructions")} error={e.instructions} />
      <TextField
        label="Horas que se aparta el pedido esperando el pago"
        name="holdHours"
        type="number"
        min={1}
        max={168}
        hint="Pasado ese tiempo sin pago, el pedido vence y los productos vuelven a estar disponibles. Si recibes el dinero después, aún puedes marcarlo como pagado."
        defaultValue={v("holdHours")}
        error={e.holdHours}
      />
      <button type="submit" disabled={pending} className={buttonStyles("primary")}>
        {pending ? "Guardando…" : "Guardar transferencia"}
      </button>
    </form>
  );
}

interface Pickup {
  id?: string;
  name: string;
  address: string;
  hours: string;
  isActive: boolean;
}

function PickupEditor({ pickup }: { pickup: Pickup }) {
  const [state, action, pending] = useForm(savePickupAction);
  const [removeState, removeAction, removing] = useActionState<FormState, FormData>(removePickupAction, {});
  const v = (k: "name" | "address" | "hours") => state.values?.[k] ?? pickup[k];
  const e = state.fields ?? {};
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <form action={action} noValidate className="space-y-3">
        <Message state={state} />
        {pickup.id && <input type="hidden" name="id" value={pickup.id} />}
        <TextField label="Nombre de la tienda" name="name" defaultValue={v("name")} error={e.name} />
        <TextField label="Dirección" name="address" defaultValue={v("address")} error={e.address} />
        <TextField label="Horario" name="hours" defaultValue={v("hours")} error={e.hours} />
        <CheckboxField label="Disponible para recoger" name="isActive" defaultChecked={pickup.isActive} />
        <button type="submit" disabled={pending} className={buttonStyles(pickup.id ? "secondary-light" : "primary")}>
          {pending ? "Guardando…" : pickup.id ? "Guardar tienda" : "Agregar tienda"}
        </button>
      </form>
      {pickup.id && (
        <form action={removeAction} className="space-y-2">
          <Message state={removeState} />
          <input type="hidden" name="id" value={pickup.id} />
          <button type="submit" disabled={removing} className="inline-flex min-h-11 items-center text-state-error underline underline-offset-2">
            Quitar {pickup.name}
          </button>
        </form>
      )}
    </div>
  );
}

export function PickupList({ pickups }: { pickups: (Pickup & { id: string })[] }) {
  return (
    <div className="max-w-xl space-y-4">
      {pickups.length === 0 && <p className="text-text-muted">No hay tiendas para recoger. Sin ellas, el cliente solo puede elegir envío a domicilio.</p>}
      {pickups.map((p) => (
        <PickupEditor key={p.id} pickup={p} />
      ))}
      <h3 className="pt-2 text-lg">Agregar una tienda</h3>
      <PickupEditor key="nueva" pickup={{ name: "", address: "", hours: "", isActive: true }} />
    </div>
  );
}

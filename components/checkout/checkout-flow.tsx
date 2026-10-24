"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { CatalogImage } from "@/components/catalog-image";
import { Marker } from "@/components/marker";
import { buttonStyles } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import type { CartView } from "@/lib/cart/types";
import { billingSchema, contactSchema, deliverySchema, termsSchema } from "@/lib/checkout/schema";
import { cn } from "@/lib/cn";
import { departamentos } from "@/lib/geo/departamentos";
import { formatGTQ } from "@/lib/money";
import type { PaymentMethod } from "@/lib/payments/types";

interface Props {
  cart: CartView;
  rates: { departamento: string; price: number; estimatedDays: number }[];
  pickups: { id: string; name: string; address: string; hours: string }[];
  addresses: { id: string; nombre: string; telefono: string; departamento: string; municipio: string; direccion: string; referencia: string }[];
  methods: PaymentMethod[];
  user: { name: string; email: string; phone: string } | null;
}

interface Draft {
  contact: { name: string; email: string; phone: string };
  method: "domicilio" | "recogida";
  home: { nombre: string; telefono: string; departamento: string; municipio: string; direccion: string; referencia: string };
  pickupLocationId: string;
  billing: { taxId: string; taxName: string };
  paymentMethod: string;
  acceptTerms: boolean;
}

type Errors = Record<string, string>;

const steps = ["Contacto", "Entrega", "Facturación", "Pago", "Revisión"] as const;
const DRAFT_KEY = "zt_checkout_borrador";
const IDEM_KEY = "zt_checkout_clave";

// Qué paso corresponde a cada campo con error que devuelve el servidor.
const stepOfField = (key: string): number => {
  if (key.startsWith("contact")) return 0;
  if (key.startsWith("delivery")) return 1;
  if (key.startsWith("billing")) return 2;
  return 3;
};

function issuesToErrors(issues: { path: PropertyKey[]; message: string }[]): Errors {
  const errors: Errors = {};
  for (const issue of issues) errors[String(issue.path[0] ?? "_")] ??= issue.message;
  return errors;
}

const subscribeNothing = () => () => {};
const readSavedDraft = () => {
  try {
    return sessionStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
};

/**
 * El borrador vive solo en esta pestaña: si se recarga o el pago falla, no se pierde lo escrito.
 * Se lee después de hidratar y el formulario se monta de nuevo una vez con los datos restaurados.
 */
export function CheckoutFlow(props: Props) {
  const saved = useSyncExternalStore(subscribeNothing, readSavedDraft, () => null);
  let restored: { draft: Partial<Draft>; step: number } | null = null;
  if (saved) {
    try {
      restored = JSON.parse(saved);
    } catch {
      restored = null;
    }
  }
  return <CheckoutForm key={restored ? "restaurado" : "nuevo"} {...props} restored={restored} />;
}

function CheckoutForm({ cart, rates, pickups, addresses, methods, user, restored }: Props & { restored: { draft: Partial<Draft>; step: number } | null }) {
  const [step, setStep] = useState(() => Math.min(Math.max(restored?.step ?? 0, 0), steps.length - 1));
  const [draft, setDraft] = useState<Draft>(() => ({
    contact: { name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" },
    method: "domicilio",
    home: { nombre: user?.name ?? "", telefono: user?.phone ?? "", departamento: "", municipio: "", direccion: "", referencia: "" },
    pickupLocationId: pickups.length === 1 ? pickups[0].id : "",
    billing: { taxId: "", taxName: "" },
    paymentMethod: methods.length === 1 ? methods[0].id : "",
    ...restored?.draft,
    // Los términos se aceptan de nuevo en cada compra.
    acceptTerms: false,
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<{ message: string; orderCode?: string; cart?: boolean } | null>(null);
  const [paying, setPaying] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ draft: { ...draft, acceptTerms: false }, step }));
    } catch {
      /* sin borrador */
    }
  }, [draft, step]);

  const goTo = useCallback((next: number) => {
    setStep(next);
    setErrors({});
    requestAnimationFrame(() => heading.current?.focus());
  }, []);

  const rate = useMemo(() => rates.find((r) => r.departamento === draft.home.departamento), [rates, draft.home.departamento]);
  const shipping = draft.method === "recogida" ? 0 : (rate?.price ?? null);
  const total = cart.subtotal - cart.discount + (shipping ?? 0);
  const pickup = pickups.find((p) => p.id === draft.pickupLocationId);

  const setContact = (k: keyof Draft["contact"], v: string) => setDraft((d) => ({ ...d, contact: { ...d.contact, [k]: v } }));
  const setHome = (k: keyof Draft["home"], v: string) => setDraft((d) => ({ ...d, home: { ...d.home, [k]: v } }));
  const setBilling = (k: keyof Draft["billing"], v: string) => setDraft((d) => ({ ...d, billing: { ...d.billing, [k]: v } }));

  const deliveryInput = draft.method === "domicilio" ? { method: "domicilio" as const, ...draft.home, referencia: draft.home.referencia || undefined } : { method: "recogida" as const, pickupLocationId: draft.pickupLocationId };

  /** Valida el paso actual y, si todo está bien, avanza. Con errores deja los mensajes junto a cada campo. */
  const validateStep = (index: number): boolean => {
    let found: Errors = {};
    if (index === 0) {
      const r = contactSchema.safeParse(draft.contact);
      if (!r.success) found = issuesToErrors(r.error.issues);
    } else if (index === 1) {
      const r = deliverySchema.safeParse(deliveryInput);
      if (!r.success) found = issuesToErrors(r.error.issues);
      else if (draft.method === "domicilio" && shipping === null) {
        found = { departamento: `Todavía no tenemos tarifa de envío para ${draft.home.departamento}. Elige recogida en tienda o escríbenos.` };
      }
    } else if (index === 2) {
      const r = billingSchema.safeParse(draft.billing);
      if (!r.success) found = issuesToErrors(r.error.issues);
    } else if (index === 3) {
      if (!draft.paymentMethod) found.paymentMethod = "Elige cómo quieres pagar.";
      const r = termsSchema.safeParse({ acceptTerms: draft.acceptTerms });
      if (!r.success) found.acceptTerms = r.error.issues[0].message;
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => {
        const first = document.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]');
        first?.focus();
      });
      return false;
    }
    return true;
  };

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) return;
    // Lo que ya se escribió se reutiliza en el paso siguiente, sin pisar lo que la persona haya cambiado.
    if (step === 0) {
      setDraft((d) => ({
        ...d,
        home: { ...d.home, nombre: d.home.nombre || d.contact.name, telefono: d.home.telefono || d.contact.phone },
        billing: { ...d.billing, taxName: d.billing.taxName || d.contact.name },
      }));
    }
    goTo(step + 1);
  };

  const pay = async () => {
    // Antes de cobrar se vuelve a validar todo: nada llega al servidor sin pasar por las mismas reglas.
    for (let i = 0; i < 4; i++) {
      if (!validateStep(i)) {
        goTo(i);
        return;
      }
    }
    if (cart.blocking) {
      setFormError({ message: "Algunos productos de tu carrito ya no están disponibles con esa cantidad.", cart: true });
      return;
    }
    setPaying(true);
    setFormError(null);

    let key = "";
    try {
      key = sessionStorage.getItem(IDEM_KEY) ?? "";
      if (!key) {
        key = crypto.randomUUID();
        sessionStorage.setItem(IDEM_KEY, key);
      }
    } catch {
      key = crypto.randomUUID();
    }

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: draft.contact,
          delivery: deliveryInput,
          billing: draft.billing,
          paymentMethod: draft.paymentMethod,
          acceptTerms: draft.acceptTerms,
          expectedTotal: total,
          idempotencyKey: key,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        code?: string;
        orderCode?: string;
        fields?: Record<string, string>;
        payment?: { kind: "redirect"; url: string } | { kind: "embedded"; clientToken: string };
      };

      if (res.ok && data.payment?.kind === "redirect") {
        try {
          sessionStorage.removeItem(IDEM_KEY);
          sessionStorage.removeItem(DRAFT_KEY);
        } catch {
          /* nada que limpiar */
        }
        window.location.assign(data.payment.url);
        return;
      }
      if (res.ok) {
        setFormError({ message: "Esta forma de pago todavía no está disponible. Elige otra." });
      } else if (data.fields) {
        const target = Math.min(...Object.keys(data.fields).map(stepOfField));
        setErrors(Object.fromEntries(Object.entries(data.fields).map(([k, v]) => [k.split(".").pop() ?? k, v])));
        goTo(target);
        setFormError({ message: data.error ?? "Revisa los datos marcados." });
      } else {
        setFormError({
          message: data.error ?? "No pudimos procesar tu pedido. Inténtalo de nuevo.",
          orderCode: data.orderCode,
          cart: data.code === "sin_stock" || data.code === "carrito_con_problemas" || data.code === "carrito_vacio",
        });
      }
    } catch {
      setFormError({ message: "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo; tus datos siguen aquí." });
    }
    setPaying(false);
  };

  const summary = (
    <div className="space-y-4">
      <ul className="divide-y divide-border">
        {cart.lines.map((line) => (
          <li key={line.id} className="flex gap-3 py-3">
            <div className="size-14 shrink-0 overflow-hidden rounded-sm bg-surface-light-alt">
              {line.image && <CatalogImage src={line.image.url} alt="" width={112} height={112} className="size-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">{line.productName}</p>
              {line.variantName && <p className="text-text-muted">{line.variantName}</p>}
              <p className="text-text-muted">Cantidad: {line.quantity}</p>
            </div>
            <p className="text-sm font-medium">{formatGTQ(line.lineTotal)}</p>
          </li>
        ))}
      </ul>
      <dl className="space-y-2 border-t border-border pt-4">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatGTQ(cart.subtotal)}</dd>
        </div>
        {cart.discount > 0 && (
          <div className="flex justify-between text-state-success">
            <dt>Cupón {cart.coupon?.code}</dt>
            <dd>-{formatGTQ(cart.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>Envío</dt>
          <dd>{draft.method === "recogida" ? "Sin costo" : shipping !== null ? formatGTQ(shipping) : "Elige tu departamento"}</dd>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-lg font-medium">
          <dt>Total</dt>
          <dd>{formatGTQ(total)}</dd>
        </div>
      </dl>
    </div>
  );

  return (
    <div className="mx-auto max-w-page px-4 py-6 md:px-6 md:py-8">
      <h1 className="text-2xl md:text-3xl">Finalizar compra</h1>

      <ol className="mt-5 flex flex-wrap gap-x-2 gap-y-1" aria-label="Pasos de la compra">
        {steps.map((label, i) => (
          <li key={label} className="flex items-center">
            <button
              type="button"
              disabled={i > step}
              onClick={() => goTo(i)}
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-md px-3 disabled:cursor-default",
                i === step ? "bg-surface-dark-alt text-text-on-dark" : i < step ? "text-text-on-light hover:bg-surface-light-alt" : "text-text-muted",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full border text-sm",
                  i < step ? "border-state-success bg-state-success text-brand-white" : "border-current",
                )}
              >
                {i < step ? <Check size={14} strokeWidth={2.5} /> : i + 1}
              </span>
              {label}
              {i < step && <span className="sr-only"> (completado, volver a editar)</span>}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_24rem] lg:gap-12">
        <div>
          <details className="mb-6 rounded-lg bg-surface-light-alt lg:hidden">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between px-4 py-2 font-medium">
              <span>Resumen del pedido</span>
              <span>{formatGTQ(total)}</span>
            </summary>
            <div className="px-4 pb-4">{summary}</div>
          </details>

          {formError && (
            <div role="alert" className="mb-6 rounded-md border border-state-error p-4">
              <p className="font-medium text-state-error">{formError.message}</p>
              <div className="mt-2 flex flex-wrap gap-4">
                {formError.cart && (
                  <Link href="/carrito" className="text-brand-primary-strong underline underline-offset-2">
                    Revisar mi carrito
                  </Link>
                )}
                {formError.orderCode && (
                  <Link href={`/pedido/${formError.orderCode}/confirmacion`} className="text-brand-primary-strong underline underline-offset-2">
                    Ver mi pedido e intentar de nuevo
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={step < 4 ? next : (e) => e.preventDefault()} noValidate className="max-w-xl">
            <h2 ref={heading} tabIndex={-1} className="mb-5 text-xl outline-none">
              {step + 1}. {steps[step]}
            </h2>

            {step === 0 && (
              <div className="space-y-4">
                {!user && (
                  <p className="text-text-muted">
                    Compras como invitado, sin crear cuenta. ¿Ya tienes una?{" "}
                    <Link href="/ingresar?volver=/checkout" className="text-brand-primary-strong underline underline-offset-2">
                      Ingresa
                    </Link>
                    .
                  </p>
                )}
                <TextField label="Nombre completo" name="name" autoComplete="name" value={draft.contact.name} onChange={(e) => setContact("name", e.target.value)} error={errors.name} />
                <TextField label="Correo" name="email" type="email" autoComplete="email" inputMode="email" hint="Aquí te enviamos la confirmación y los cambios de tu pedido." value={draft.contact.email} onChange={(e) => setContact("email", e.target.value)} error={errors.email} />
                <TextField label="Teléfono" name="phone" type="tel" autoComplete="tel" inputMode="tel" hint="Para coordinar la entrega. Ejemplo: 5555 1234." value={draft.contact.phone} onChange={(e) => setContact("phone", e.target.value)} error={errors.phone} />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <fieldset>
                  <legend className="mb-2 font-medium">¿Cómo quieres recibirlo?</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(
                      [
                        ["domicilio", "Envío a domicilio", "Lo llevamos a tu dirección."],
                        ["recogida", "Recoger en tienda", "Sin costo de envío."],
                      ] as const
                    ).map(([value, title, text]) => (
                      <label key={value} className={cn("flex cursor-pointer items-start gap-3 rounded-md border p-4", draft.method === value ? "border-brand-primary ring-1 ring-brand-primary" : "border-border-strong")}>
                        <input type="radio" name="metodo-entrega" checked={draft.method === value} onChange={() => { setDraft((d) => ({ ...d, method: value })); setErrors({}); }} className="mt-1 size-5 accent-brand-primary" />
                        <span>
                          <span className="block font-medium">{title}</span>
                          <span className="text-sm text-text-muted">{text}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {draft.method === "domicilio" ? (
                  <div className="space-y-4">
                    {addresses.length > 0 && (
                      <SelectField
                        label="Usar una dirección guardada"
                        placeholder="Escribir una nueva"
                        options={addresses.map((a) => `${a.nombre}, ${a.direccion}, ${a.municipio}`)}
                        value=""
                        onChange={(e) => {
                          const a = addresses.find((x) => `${x.nombre}, ${x.direccion}, ${x.municipio}` === e.target.value);
                          if (a) setDraft((d) => ({ ...d, home: { nombre: a.nombre, telefono: a.telefono, departamento: a.departamento, municipio: a.municipio, direccion: a.direccion, referencia: a.referencia } }));
                        }}
                      />
                    )}
                    <TextField label="Nombre de quien recibe" name="nombre" autoComplete="shipping name" value={draft.home.nombre} onChange={(e) => setHome("nombre", e.target.value)} error={errors.nombre} />
                    <TextField label="Teléfono de quien recibe" name="telefono" type="tel" autoComplete="shipping tel" inputMode="tel" value={draft.home.telefono} onChange={(e) => setHome("telefono", e.target.value)} error={errors.telefono} />
                    <SelectField label="Departamento" name="departamento" autoComplete="shipping address-level1" options={[...departamentos]} value={draft.home.departamento} onChange={(e) => setHome("departamento", e.target.value)} error={errors.departamento} />
                    {draft.home.departamento && rate && (
                      <p className="-mt-2 text-sm text-text-muted">
                        Envío a {draft.home.departamento}: {formatGTQ(rate.price)}. Entrega en unos {rate.estimatedDays} {rate.estimatedDays === 1 ? "día" : "días"}.
                      </p>
                    )}
                    <TextField label="Municipio" name="municipio" autoComplete="shipping address-level2" value={draft.home.municipio} onChange={(e) => setHome("municipio", e.target.value)} error={errors.municipio} />
                    <TextField label="Dirección" name="direccion" autoComplete="shipping street-address" hint="Zona, calle o avenida, número de casa." value={draft.home.direccion} onChange={(e) => setHome("direccion", e.target.value)} error={errors.direccion} />
                    <TextField label="Referencia (opcional)" name="referencia" hint="Algo que ayude a ubicarte: color del portón, un negocio cercano." value={draft.home.referencia} onChange={(e) => setHome("referencia", e.target.value)} error={errors.referencia} />
                  </div>
                ) : (
                  <fieldset aria-describedby={errors.pickupLocationId ? "pickup-error" : undefined}>
                    <legend className="mb-2 font-medium">Tienda donde recoges</legend>
                    {pickups.length === 0 ? (
                      <p className="text-text-muted">Por ahora no hay tiendas para recoger. Elige envío a domicilio.</p>
                    ) : (
                      <div className="space-y-2">
                        {pickups.map((p) => (
                          <label key={p.id} className={cn("flex cursor-pointer items-start gap-3 rounded-md border p-4", draft.pickupLocationId === p.id ? "border-brand-primary ring-1 ring-brand-primary" : "border-border-strong")}>
                            <input type="radio" name="tienda" checked={draft.pickupLocationId === p.id} onChange={() => setDraft((d) => ({ ...d, pickupLocationId: p.id }))} data-invalid={errors.pickupLocationId ? "true" : undefined} className="mt-1 size-5 accent-brand-primary" />
                            <span>
                              <span className="block font-medium">{p.name}</span>
                              <span className="block text-sm text-text-muted">
                                {p.address.startsWith("[") ? <Marker>{p.address}</Marker> : p.address}
                              </span>
                              <span className="block text-sm text-text-muted">
                                Horario: {p.hours.startsWith("[") ? <Marker>{p.hours}</Marker> : p.hours}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                    {errors.pickupLocationId && (
                      <p id="pickup-error" className="mt-2 text-sm text-state-error">
                        {errors.pickupLocationId}
                      </p>
                    )}
                  </fieldset>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-text-muted">Usamos estos datos para tu factura. Si no la necesitas a tu nombre, elige consumidor final.</p>
                <TextField label="NIT" name="taxId" autoComplete="off" hint="Ejemplo: 1234567-8, o CF." value={draft.billing.taxId} onChange={(e) => setBilling("taxId", e.target.value)} error={errors.taxId} />
                <TextField label="Nombre para la factura" name="taxName" autoComplete="name" value={draft.billing.taxName} onChange={(e) => setBilling("taxName", e.target.value)} error={errors.taxName} />
                <button type="button" onClick={() => setDraft((d) => ({ ...d, billing: { taxId: "CF", taxName: "Consumidor final" } }))} className="inline-flex min-h-11 items-center text-brand-primary-strong underline underline-offset-2">
                  Usar consumidor final (CF)
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <fieldset>
                  <legend className="mb-2 font-medium">Forma de pago</legend>
                  <div className="space-y-2">
                    {methods.map((m) => (
                      <label key={m.id} className={cn("flex cursor-pointer items-start gap-3 rounded-md border p-4", draft.paymentMethod === m.id ? "border-brand-primary ring-1 ring-brand-primary" : "border-border-strong")}>
                        <input type="radio" name="forma-pago" checked={draft.paymentMethod === m.id} onChange={() => setDraft((d) => ({ ...d, paymentMethod: m.id }))} data-invalid={errors.paymentMethod ? "true" : undefined} className="mt-1 size-5 accent-brand-primary" />
                        <span>
                          <span className="block font-medium">{m.label}</span>
                          <span className="text-sm text-text-muted">{m.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.paymentMethod && <p className="mt-2 text-sm text-state-error">{errors.paymentMethod}</p>}
                  <p className="mt-3 text-sm text-text-muted">Nunca pedimos ni guardamos los datos de tu tarjeta en esta tienda: el pago se completa en la página del proveedor.</p>
                </fieldset>
                <div>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" checked={draft.acceptTerms} onChange={(e) => setDraft((d) => ({ ...d, acceptTerms: e.target.checked }))} aria-invalid={errors.acceptTerms ? true : undefined} aria-describedby={errors.acceptTerms ? "terminos-error" : undefined} className="mt-1 size-5 accent-brand-primary" />
                    <span>
                      Acepto los{" "}
                      <Link href="/terminos" target="_blank" className="text-brand-primary-strong underline underline-offset-2">
                        términos y condiciones
                      </Link>{" "}
                      y la{" "}
                      <Link href="/privacidad" target="_blank" className="text-brand-primary-strong underline underline-offset-2">
                        política de privacidad
                      </Link>
                      .
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p id="terminos-error" className="mt-2 text-sm text-state-error">
                      {errors.acceptTerms}
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {(
                    [
                      ["Contacto", `${draft.contact.name} · ${draft.contact.email} · ${draft.contact.phone}`, 0],
                      [
                        "Entrega",
                        draft.method === "domicilio"
                          ? `${draft.home.nombre}, ${draft.home.direccion}, ${draft.home.municipio}, ${draft.home.departamento}`
                          : `Recoger en ${pickup?.name ?? "tienda"}`,
                        1,
                      ],
                      ["Factura", `${draft.billing.taxName} · NIT ${draft.billing.taxId}`, 2],
                      ["Pago", methods.find((m) => m.id === draft.paymentMethod)?.label ?? "", 3],
                    ] as const
                  ).map(([label, value, target]) => (
                    <li key={label} className="flex items-start justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="font-medium">{label}</p>
                        <p className="break-words text-text-muted">{value}</p>
                      </div>
                      <button type="button" onClick={() => goTo(target)} className="inline-flex min-h-11 shrink-0 items-center text-brand-primary-strong underline underline-offset-2">
                        Cambiar<span className="sr-only"> {label.toLowerCase()}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {cart.priceChanged && (
                  <p role="status" className="rounded-md border border-state-warning p-3">
                    Cambió el precio de algunos productos de tu carrito. El total que ves ya los incluye.
                  </p>
                )}
                <button type="button" onClick={pay} disabled={paying || cart.blocking} className={cn(buttonStyles("primary"), "w-full text-lg sm:w-auto sm:min-w-72")}>
                  {paying ? "Procesando…" : `Pagar ${formatGTQ(total)}`}
                </button>
                <p className="text-sm text-text-muted">Al pagar apartamos tus productos por unos minutos mientras completas el pago.</p>
              </div>
            )}

            {step < 4 && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button type="submit" className={buttonStyles("primary")}>
                  Continuar
                </button>
                {step > 0 && (
                  <button type="button" onClick={() => goTo(step - 1)} className={buttonStyles("secondary-light")}>
                    Volver
                  </button>
                )}
              </div>
            )}
            {step === 4 && (
              <div className="mt-4">
                <button type="button" onClick={() => goTo(3)} className="inline-flex min-h-11 items-center text-brand-primary-strong underline underline-offset-2">
                  Volver
                </button>
              </div>
            )}
          </form>
        </div>

        <aside aria-label="Resumen del pedido" className="hidden h-fit rounded-lg bg-surface-light-alt p-5 lg:block">
          <h2 className="mb-2 text-lg">Resumen del pedido</h2>
          {summary}
        </aside>
      </div>
    </div>
  );
}

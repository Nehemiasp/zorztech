"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Message } from "@/components/auth/forms";
import { buttonStyles } from "@/components/ui/button";
import { CheckboxField, TextField } from "@/components/ui/field";
import { deleteCouponAction, saveCouponAction } from "@/app/admin/cupones/actions";
import type { FormState } from "@/lib/auth/actions";

export interface CouponValues {
  id?: string;
  code: string;
  type: "porcentaje" | "monto";
  value: string;
  minSubtotal: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  isActive: boolean;
}

export const emptyCoupon: CouponValues = { code: "", type: "porcentaje", value: "", minSubtotal: "", startsAt: "", endsAt: "", usageLimit: "", isActive: true };

export function CouponForm({ coupon = emptyCoupon }: { coupon?: CouponValues }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCouponAction, {});
  const [type, setType] = useState<"porcentaje" | "monto">((state.values?.type as "porcentaje" | "monto") ?? coupon.type);
  const v = (key: keyof CouponValues) => (state.values?.[key] ?? coupon[key] ?? "") as string;
  const e = state.fields ?? {};

  return (
    <form action={action} noValidate className="max-w-xl space-y-4">
      <Message state={state} />
      {coupon.id && <input type="hidden" name="id" value={coupon.id} />}
      <TextField label="Código" name="code" autoCapitalize="characters" hint="Lo escribe el cliente en el carrito. Ejemplo: BIENVENIDO10." defaultValue={v("code")} error={e.code} />
      <fieldset>
        <legend className="mb-1 font-medium">Tipo de descuento</legend>
        <div className="flex flex-wrap gap-4">
          {(
            [
              ["porcentaje", "Porcentaje del subtotal"],
              ["monto", "Monto fijo en quetzales"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="radio" name="type" value={value} checked={type === value} onChange={() => setType(value)} className="size-5 accent-brand-primary" />
              {label}
            </label>
          ))}
        </div>
        {e.type && <p className="text-sm text-state-error">{e.type}</p>}
      </fieldset>
      <TextField
        label={type === "porcentaje" ? "Porcentaje (1 a 100)" : "Monto del descuento (Q)"}
        name="value"
        inputMode="decimal"
        hint={type === "porcentaje" ? "Se calcula sobre el subtotal de los productos, sin el envío." : "Nunca supera el subtotal de la compra."}
        defaultValue={v("value")}
        error={e.value}
      />
      <TextField label="Compra mínima (Q, opcional)" name="minSubtotal" inputMode="decimal" defaultValue={v("minSubtotal")} error={e.minSubtotal} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Vigente desde (opcional)" name="startsAt" type="date" defaultValue={v("startsAt")} error={e.startsAt} />
        <TextField label="Vigente hasta (opcional)" name="endsAt" type="date" defaultValue={v("endsAt")} error={e.endsAt} />
      </div>
      <TextField label="Límite de usos (opcional)" name="usageLimit" type="number" min={1} inputMode="numeric" hint="Entre todos los clientes. Un pedido que se cancela o vence devuelve su uso." defaultValue={v("usageLimit")} error={e.usageLimit} />
      <CheckboxField label="Cupón activo" name="isActive" defaultChecked={coupon.isActive} />
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className={buttonStyles("primary")}>
          {pending ? "Guardando…" : coupon.id ? "Guardar cambios" : "Crear cupón"}
        </button>
        <Link href="/admin/cupones" className={buttonStyles("secondary-light")}>
          Volver a cupones
        </Link>
      </div>
    </form>
  );
}

export function DeleteCouponForm({ id, code }: { id: string; code: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteCouponAction, {});
  return (
    <form action={action} className="space-y-3">
      <Message state={state} />
      <input type="hidden" name="id" value={id} />
      <p className="text-text-muted">Solo se puede borrar un cupón que ningún pedido haya usado.</p>
      <button type="submit" disabled={pending} className={buttonStyles("secondary-light")}>
        Borrar {code}
      </button>
    </form>
  );
}

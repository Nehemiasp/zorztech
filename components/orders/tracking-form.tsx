"use client";

import { useActionState } from "react";
import { trackOrder, type TrackingState } from "@/app/pedido/seguimiento/actions";
import { buttonStyles } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";

export function TrackingForm({ defaultCode }: { defaultCode: string }) {
  const [state, action, pending] = useActionState<TrackingState, FormData>(trackOrder, {});

  return (
    <form action={action} noValidate className="max-w-md space-y-4">
      {state.error && (
        <p role="alert" className="rounded-md border border-state-error p-3 text-state-error">
          {state.error}
        </p>
      )}
      <TextField
        label="Código del pedido"
        name="codigo"
        autoComplete="off"
        autoCapitalize="characters"
        hint="Lo encuentras en el correo de confirmación. Ejemplo: ZT-4K7P2QXD."
        defaultValue={state.codigo ?? defaultCode}
        error={state.fields?.codigo}
      />
      <TextField label="Correo de la compra" name="email" type="email" autoComplete="email" inputMode="email" error={state.fields?.email} />
      <button type="submit" disabled={pending} className={buttonStyles("primary")}>
        {pending ? "Buscando…" : "Ver mi pedido"}
      </button>
    </form>
  );
}

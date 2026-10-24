"use client";

import { useActionState } from "react";
import { Message } from "@/components/auth/forms";
import { buttonStyles } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { changePasswordAction, updateProfileAction, type FormState } from "@/lib/auth/actions";
import { saveAddressAction } from "@/lib/account/actions";
import { departamentos } from "@/lib/geo/departamentos";

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, {});
  return (
    <form action={action} noValidate className="max-w-md space-y-4">
      <Message state={state} />
      <TextField label="Nombre completo" name="name" autoComplete="name" defaultValue={state.values?.name ?? name} error={state.fields?.name} />
      <TextField label="Teléfono" name="phone" type="tel" autoComplete="tel" inputMode="tel" hint="Opcional. Ejemplo: 5555 1234." defaultValue={state.values?.phone ?? phone} error={state.fields?.phone} />
      <TextField label="Correo" name="email" type="email" value={email} readOnly hint="Para cambiar tu correo, escríbenos." />
      <button type="submit" disabled={pending} className={buttonStyles("primary")}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePasswordAction, {});
  return (
    <form action={action} noValidate className="max-w-md space-y-4">
      <Message state={state} />
      <TextField label="Contraseña actual" name="current" type="password" autoComplete="current-password" error={state.fields?.current} />
      <TextField label="Nueva contraseña" name="password" type="password" autoComplete="new-password" hint="Al menos 8 caracteres." error={state.fields?.password} />
      <button type="submit" disabled={pending} className={buttonStyles("primary")}>
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}

interface AddressValues {
  id?: string;
  nombre: string;
  telefono: string;
  departamento: string;
  municipio: string;
  direccion: string;
  referencia: string;
}

const empty: AddressValues = { nombre: "", telefono: "", departamento: "", municipio: "", direccion: "", referencia: "" };

export function AddressForm({ address = empty, onDone }: { address?: AddressValues; onDone?: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await saveAddressAction(prev, formData);
    if (result.success) onDone?.();
    return result;
  }, {});
  const v = (key: keyof AddressValues) => state.values?.[key] ?? address[key] ?? "";
  return (
    <form action={action} noValidate className="max-w-xl space-y-4">
      <Message state={state} />
      {address.id && <input type="hidden" name="id" value={address.id} />}
      <TextField label="Nombre de quien recibe" name="nombre" autoComplete="name" defaultValue={v("nombre")} error={state.fields?.nombre} />
      <TextField label="Teléfono" name="telefono" type="tel" autoComplete="tel" inputMode="tel" defaultValue={v("telefono")} error={state.fields?.telefono} />
      <SelectField label="Departamento" name="departamento" options={[...departamentos]} defaultValue={v("departamento")} error={state.fields?.departamento} />
      <TextField label="Municipio" name="municipio" defaultValue={v("municipio")} error={state.fields?.municipio} />
      <TextField label="Dirección" name="direccion" hint="Zona, calle o avenida, número de casa." defaultValue={v("direccion")} error={state.fields?.direccion} />
      <TextField label="Referencia (opcional)" name="referencia" defaultValue={v("referencia")} error={state.fields?.referencia} />
      <button type="submit" disabled={pending} className={buttonStyles("primary")}>
        {pending ? "Guardando…" : address.id ? "Guardar cambios" : "Guardar dirección"}
      </button>
    </form>
  );
}

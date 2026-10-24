"use client";

import { useActionState } from "react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { googleSignInAction, loginAction, registerAction, requestResetAction, resetPasswordAction, type FormState } from "@/lib/auth/actions";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

export function Message({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p role="alert" className="rounded-md border border-state-error p-3 text-state-error">
        {state.error}
      </p>
    );
  if (state.success)
    return (
      <p role="status" className="rounded-md border border-state-success p-3 text-state-success">
        {state.success}
      </p>
    );
  return null;
}

function useAuthAction(action: Action) {
  return useActionState<FormState, FormData>(action, {});
}

export function LoginForm({ returnTo, googleEnabled }: { returnTo: string; googleEnabled: boolean }) {
  const [state, action, pending] = useAuthAction(loginAction);
  return (
    <div className="space-y-4">
    <form action={action} noValidate className="space-y-4">
      <Message state={state} />
      <input type="hidden" name="volver" value={returnTo} />
      <TextField label="Correo" name="email" type="email" autoComplete="email" inputMode="email" defaultValue={state.values?.email} error={state.fields?.email} />
      <TextField label="Contraseña" name="password" type="password" autoComplete="current-password" error={state.fields?.password} />
      <button type="submit" disabled={pending} className={`${buttonStyles("primary")} w-full`}>
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
      <p className="flex flex-wrap justify-between gap-2 text-sm">
        <Link href="/recuperar" className="inline-flex min-h-11 items-center text-brand-primary-strong underline underline-offset-2">
          Olvidé mi contraseña
        </Link>
        <Link href={`/registro?volver=${encodeURIComponent(returnTo)}`} className="inline-flex min-h-11 items-center text-brand-primary-strong underline underline-offset-2">
          Crear una cuenta
        </Link>
      </p>
    </form>
    {googleEnabled && (
      <form action={googleSignInAction}>
        <input type="hidden" name="volver" value={returnTo} />
        <button type="submit" className={`${buttonStyles("secondary-light")} w-full`}>
          Continuar con Google
        </button>
      </form>
    )}
    </div>
  );
}

export function RegisterForm({ returnTo }: { returnTo: string }) {
  const [state, action, pending] = useAuthAction(registerAction);
  return (
    <form action={action} noValidate className="space-y-4">
      <Message state={state} />
      <input type="hidden" name="volver" value={returnTo} />
      <TextField label="Nombre completo" name="name" autoComplete="name" defaultValue={state.values?.name} error={state.fields?.name} />
      <TextField label="Correo" name="email" type="email" autoComplete="email" inputMode="email" defaultValue={state.values?.email} error={state.fields?.email} />
      <TextField label="Contraseña" name="password" type="password" autoComplete="new-password" hint="Al menos 8 caracteres." error={state.fields?.password} />
      <button type="submit" disabled={pending} className={`${buttonStyles("primary")} w-full`}>
        {pending ? "Creando tu cuenta…" : "Crear cuenta"}
      </button>
      <p className="text-sm text-text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href={`/ingresar?volver=${encodeURIComponent(returnTo)}`} className="text-brand-primary-strong underline underline-offset-2">
          Ingresa
        </Link>
        .
      </p>
    </form>
  );
}

export function RecoverForm() {
  const [state, action, pending] = useAuthAction(requestResetAction);
  return (
    <form action={action} noValidate className="space-y-4">
      <Message state={state} />
      <p className="text-text-muted">Escribe el correo de tu cuenta y te enviamos un enlace para elegir una nueva contraseña.</p>
      <TextField label="Correo" name="email" type="email" autoComplete="email" inputMode="email" defaultValue={state.values?.email} error={state.fields?.email} />
      <button type="submit" disabled={pending} className={`${buttonStyles("primary")} w-full`}>
        {pending ? "Enviando…" : "Enviar enlace"}
      </button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useAuthAction(resetPasswordAction);
  return (
    <form action={action} noValidate className="space-y-4">
      <Message state={state} />
      <input type="hidden" name="token" value={token} />
      <TextField label="Nueva contraseña" name="password" type="password" autoComplete="new-password" hint="Al menos 8 caracteres." error={state.fields?.password} />
      <button type="submit" disabled={pending} className={`${buttonStyles("primary")} w-full`}>
        {pending ? "Guardando…" : "Guardar contraseña"}
      </button>
      {state.error && (
        <p>
          <Link href="/recuperar" className="text-brand-primary-strong underline underline-offset-2">
            Pedir un enlace nuevo
          </Link>
        </p>
      )}
    </form>
  );
}

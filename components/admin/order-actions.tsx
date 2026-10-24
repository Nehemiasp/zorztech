"use client";

import { useActionState, useRef } from "react";
import { Message } from "@/components/auth/forms";
import { buttonStyles } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/field";
import { addNoteAction, changeStatusAction } from "@/app/admin/pedidos/actions";
import type { FormState } from "@/lib/auth/actions";
import type { OrderStatus } from "@/lib/generated/prisma/client";

export interface StatusOption {
  to: OrderStatus;
  label: string;
  /** Acciones difíciles de deshacer: piden confirmación. */
  confirm?: string;
}

/** Botones de cambio de estado. Cancelar y reembolsar abren una confirmación antes de actuar. */
export function StatusActions({ code, options }: { code: string; options: StatusOption[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(changeStatusAction, {});
  const dialog = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const pendingTo = useRef<StatusOption | null>(null);
  const toInput = useRef<HTMLInputElement>(null);
  const confirmText = useRef<HTMLParagraphElement>(null);

  if (options.length === 0) {
    return (
      <div className="space-y-3">
        <Message state={state} />
        <p className="text-text-muted">Este pedido está en un estado final: no admite más cambios.</p>
      </div>
    );
  }

  const choose = (option: StatusOption) => {
    if (toInput.current) toInput.current.value = option.to;
    if (!option.confirm) {
      formRef.current?.requestSubmit();
      return;
    }
    pendingTo.current = option;
    if (confirmText.current) confirmText.current.textContent = option.confirm;
    dialog.current?.showModal();
  };

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <Message state={state} />
      <input type="hidden" name="codigo" value={code} />
      <input ref={toInput} type="hidden" name="to" defaultValue="" />
      <TextAreaField label="Nota para el historial (opcional)" name="nota" rows={2} hint="Se guarda junto al cambio. El cliente no la ve." />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.to}
            type="button"
            disabled={pending}
            onClick={() => choose(o)}
            className={buttonStyles(o.confirm ? "secondary-light" : "primary")}
          >
            {o.label}
          </button>
        ))}
      </div>

      <dialog ref={dialog} aria-label="Confirmar cambio" className="m-auto w-[min(92vw,26rem)] rounded-lg bg-surface-light p-6 text-text-on-light backdrop:bg-black/50">
        <h2 className="text-lg">¿Confirmas el cambio?</h2>
        <p ref={confirmText} className="mt-2 text-text-muted" />
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => dialog.current?.close()} className={buttonStyles("secondary-light")}>
            Volver
          </button>
          <button
            type="button"
            onClick={() => {
              dialog.current?.close();
              formRef.current?.requestSubmit();
            }}
            className={buttonStyles("primary")}
          >
            Sí, continuar
          </button>
        </div>
      </dialog>
    </form>
  );
}

export function NoteForm({ code }: { code: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addNoteAction, {});
  return (
    <form action={action} className="space-y-3">
      <Message state={state} />
      <input type="hidden" name="codigo" value={code} />
      <TextAreaField label="Nota interna" name="texto" rows={3} hint="Solo la ve el equipo." error={state.fields?.texto} />
      <button type="submit" disabled={pending} className={buttonStyles("secondary-light")}>
        {pending ? "Guardando…" : "Guardar nota"}
      </button>
    </form>
  );
}

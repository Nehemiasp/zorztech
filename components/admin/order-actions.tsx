"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { Message } from "@/components/auth/forms";
import { buttonStyles } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import { addNoteAction, changeStatusAction, shipOrderAction } from "@/app/admin/pedidos/actions";
import type { FormState } from "@/lib/auth/actions";
import type { OrderStatus } from "@/lib/generated/prisma/client";

export interface StatusOption {
  to: OrderStatus;
  label: string;
  /** Acciones difíciles de deshacer: piden confirmación. */
  confirm?: string;
}

/**
 * Botones de cambio de estado. Cancelar y reembolsar abren una confirmación antes de actuar;
 * «Marcar como enviado» abre una ventana que pide el número de guía.
 */
export function StatusActions({ code, options }: { code: string; options: StatusOption[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(changeStatusAction, {});
  const dialog = useRef<HTMLDialogElement>(null);
  const shipDialog = useRef<HTMLDialogElement>(null);
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
    if (option.to === "enviado") {
      shipDialog.current?.showModal();
      return;
    }
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
    <>
      <ShipDialog code={code} dialogRef={shipDialog} />
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
              className={buttonStyles(o.confirm && o.to !== "pagado" ? "secondary-light" : "primary")}
            >
              {o.label}
            </button>
          ))}
        </div>

        <dialog ref={dialog} aria-label="Confirmar cambio" className="motion-fade m-auto w-[min(92vw,26rem)] rounded-lg bg-surface-light p-6 text-text-on-light backdrop:bg-black/50">
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
    </>
  );
}

/** Ventana para marcar como enviado: número de guía (obligatorio), empresa y foto o PDF de la guía (opcionales). */
function ShipDialog({ code, dialogRef }: { code: string; dialogRef: React.RefObject<HTMLDialogElement | null> }) {
  const [state, action, pending] = useActionState<FormState, FormData>(shipOrderAction, {});
  const fileId = useId();

  useEffect(() => {
    if (state.success) dialogRef.current?.close();
  }, [state, dialogRef]);

  return (
    <>
      {state.success && <Message state={state} />}
      <dialog
        ref={dialogRef}
        aria-labelledby={`${fileId}-titulo`}
        className="motion-fade m-auto w-[min(92vw,30rem)] rounded-lg bg-surface-light p-6 text-text-on-light backdrop:bg-black/50"
      >
        <h2 id={`${fileId}-titulo`} className="text-lg">
          Marcar como enviado
        </h2>
        <p className="mt-1 text-text-muted">El cliente recibe un correo con el número de guía y lo ve en el seguimiento de su pedido.</p>
        <form action={action} className="mt-4 space-y-4" encType="multipart/form-data">
          {state.error && <Message state={state} />}
          <input type="hidden" name="codigo" value={code} />
          <TextField label="Número de guía" name="guia" required autoComplete="off" maxLength={60} error={state.fields?.guia} />
          <TextField label="Empresa de envío (opcional)" name="empresa" autoComplete="off" maxLength={60} hint="La paquetería que lleva el pedido." error={state.fields?.empresa} />
          <div>
            <label htmlFor={fileId} className="block font-medium">
              Foto o PDF de la guía (opcional)
            </label>
            <input
              id={fileId}
              name="archivo"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              aria-describedby={`${fileId}-${state.fields?.archivo ? "error" : "hint"}`}
              aria-invalid={state.fields?.archivo ? true : undefined}
              className="mt-1 block w-full rounded-sm border border-border-strong bg-surface-light p-2 text-base file:mr-3 file:rounded-sm file:border-0 file:bg-surface-light-alt file:px-3 file:py-1.5 file:font-medium"
            />
            {state.fields?.archivo ? (
              <p id={`${fileId}-error`} className="mt-1 text-sm text-state-error">
                {state.fields.archivo}
              </p>
            ) : (
              <p id={`${fileId}-hint`} className="mt-1 text-sm text-text-muted">
                JPG, PNG, WebP o PDF de hasta 4 MB. El cliente también la puede ver.
              </p>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button type="button" onClick={() => dialogRef.current?.close()} className={buttonStyles("secondary-light")}>
              Volver
            </button>
            <button type="submit" disabled={pending} className={buttonStyles("primary")}>
              {pending ? "Guardando…" : "Marcar como enviado"}
            </button>
          </div>
        </form>
      </dialog>
    </>
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

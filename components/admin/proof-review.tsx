"use client";

import { useActionState, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { changeStatusAction } from "@/app/admin/pedidos/actions";
import { Message } from "@/components/auth/forms";
import { ProofViewer, type ProofItem } from "@/components/orders/proof-viewer";
import { buttonStyles } from "@/components/ui/button";
import type { FormState } from "@/lib/auth/actions";

/**
 * Comprobantes en el panel. Mientras el pedido espera el pago, la ventana trae «Confirmar pago» junto al monto
 * esperado, con un segundo paso para no aprobar por accidente. Usa la misma acción que «Marcar como pagado».
 */
export function ProofReview({ code, items, amount, canApprove }: { code: string; items: ProofItem[]; amount: string; canApprove: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [closeSignal, setCloseSignal] = useState(0);
  // Al confirmar, se cierra la ventana y el mensaje queda junto a las miniaturas.
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await changeStatusAction(prev, formData);
    if (result.success) {
      setConfirming(false);
      setCloseSignal((n) => n + 1);
    }
    return result;
  }, {});

  return (
    <>
      {state.success && (
        <div className="mt-3">
          <Message state={state} />
        </div>
      )}
      <ProofViewer
        variant="thumbs"
        items={items}
        closeSignal={closeSignal}
        footer={
          canApprove ? (
                  <form action={action} className="flex flex-col gap-2 sm:items-end">
                    <input type="hidden" name="codigo" value={code} />
                    <input type="hidden" name="to" value="pagado" />
                    <input type="hidden" name="nota" value="Pago confirmado al revisar el comprobante." />
                    {state.error && <Message state={state} />}
                    {confirming ? (
                      <>
                        <p className="text-sm text-text-on-dark-muted sm:text-right">
                          ¿Ya viste {amount} en tu cuenta? Se descuenta el stock y el cliente recibe un correo.
                        </p>
                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          <button type="button" onClick={() => setConfirming(false)} className={buttonStyles("secondary-dark")}>
                            Volver
                          </button>
                          <button type="submit" disabled={pending} className={buttonStyles("primary", "gap-2")}>
                            <CheckCircle2 aria-hidden size={18} />
                            {pending ? "Confirmando…" : "Sí, confirmar pago"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                        <p className="text-sm text-text-on-dark-muted">
                          Monto esperado: <strong className="font-semibold text-text-on-dark">{amount}</strong>
                        </p>
                        <button type="button" onClick={() => setConfirming(true)} className={buttonStyles("primary", "gap-2")}>
                          <CheckCircle2 aria-hidden size={18} />
                          Confirmar pago
                        </button>
                      </div>
                    )}
                  </form>
          ) : undefined
        }
      />
    </>
  );
}

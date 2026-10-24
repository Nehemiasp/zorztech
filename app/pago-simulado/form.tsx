"use client";

import { useState } from "react";
import { buttonStyles } from "@/components/ui/button";
import { simulatePayment } from "./actions";

export function SimulatedPaymentForm({ providerRef, volver }: { providerRef: string; volver: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const result = await simulatePayment(formData);
      window.location.assign(result.volver);
    } catch {
      setError("La pasarela simulada no pudo notificar a la tienda. Inténtalo de nuevo.");
      setPending(false);
    }
  }

  return (
    <form action={submit} className="mt-6 grid gap-3">
      <input type="hidden" name="ref" value={providerRef} />
      <input type="hidden" name="volver" value={volver} />
      {error && (
        <p role="alert" className="text-state-error">
          {error}
        </p>
      )}
      <button type="submit" name="resultado" value="approved" disabled={pending} className={buttonStyles("primary")}>
        Aprobar
      </button>
      <button type="submit" name="resultado" value="declined" disabled={pending} className={buttonStyles("secondary-light")}>
        Rechazar
      </button>
      <button type="submit" name="resultado" value="pending" disabled={pending} className={buttonStyles("secondary-light")}>
        Dejar pendiente
      </button>
    </form>
  );
}

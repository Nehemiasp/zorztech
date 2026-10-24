"use client";

import { useState } from "react";
import { buttonStyles } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";

/** "Avisarme cuando llegue" para una variante agotada. */
export function StockAlertForm({ variantId }: { variantId: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ status: "idle" | "sending" | "done" | "error"; message?: string }>({ status: "idle" });

  if (state.status === "done") {
    return (
      <p role="status" className="rounded-md border border-state-success p-3 text-state-success">
        Listo. Te escribimos a {email} cuando haya unidades.
      </p>
    );
  }

  return (
    <form
      noValidate
      className="mt-4 rounded-lg bg-surface-light-alt p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ status: "sending" });
        try {
          const res = await fetch("/api/avisos-stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variantId, email }),
          });
          const data = (await res.json()) as { error?: string; fields?: Record<string, string> };
          if (res.ok) setState({ status: "done" });
          else setState({ status: "error", message: data.fields?.email ?? data.error ?? "No pudimos guardar tu correo." });
        } catch {
          setState({ status: "error", message: "No pudimos conectar. Inténtalo de nuevo." });
        }
      }}
    >
      <p className="font-medium">Avisarme cuando llegue</p>
      <p className="mb-3 text-sm text-text-muted">Te escribimos una sola vez, cuando vuelva a haber unidades.</p>
      <div className="flex flex-wrap items-start gap-2">
        <TextField label="Tu correo" name="correo" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={state.status === "error" ? state.message : undefined} className="min-w-56 flex-1" />
        <button type="submit" disabled={state.status === "sending"} className={`${buttonStyles("secondary-light")} mt-7`}>
          {state.status === "sending" ? "Guardando…" : "Avisarme"}
        </button>
      </div>
    </form>
  );
}

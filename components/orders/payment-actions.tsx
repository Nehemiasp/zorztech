"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buttonStyles } from "@/components/ui/button";

/** Reintenta el pago de un pedido que sigue apartado. */
export function RetryPaymentButton({ code, label = "Intentar de nuevo" }: { code: string; label?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className={buttonStyles("primary")}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const res = await fetch("/api/payments/retry", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ codigo: code }),
            });
            const data = (await res.json()) as { error?: string; payment?: { kind: string; url?: string } };
            if (res.ok && data.payment?.kind === "redirect" && data.payment.url) {
              window.location.assign(data.payment.url);
              return;
            }
            setError(data.error ?? "No pudimos iniciar el pago. Inténtalo de nuevo.");
          } catch {
            setError("No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.");
          }
          setPending(false);
        }}
      >
        {pending ? "Procesando…" : label}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-state-error">
          {error}
        </p>
      )}
    </div>
  );
}

/** Mientras el pago está pendiente, vuelve a pedir el estado cada pocos segundos. */
export function AutoRefresh({ everyMs = 5000, maxTimes = 60 }: { everyMs?: number; maxTimes?: number }) {
  const router = useRouter();
  useEffect(() => {
    let times = 0;
    const id = setInterval(() => {
      if (++times > maxTimes) clearInterval(id);
      else router.refresh();
    }, everyMs);
    return () => clearInterval(id);
  }, [router, everyMs, maxTimes]);
  return null;
}

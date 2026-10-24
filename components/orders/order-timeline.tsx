import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime, type OrderDetail } from "@/lib/orders/queries";
import { statusDescription, statusLabel, timelineIndex, timelineSteps } from "@/lib/orders/status";

/** Línea de tiempo del pedido para el cliente. Solo muestra estados, nunca notas internas. */
export function OrderTimeline({ order }: { order: OrderDetail }) {
  const steps = timelineSteps(order.shippingMethod);
  const current = timelineIndex(order.status);
  const stoppedEarly = current === -1;
  const when = (status: string) => order.events.find((e) => e.type === "estado" && e.toStatus === status)?.createdAt;

  return (
    <div>
      <p className="text-lg font-medium" role="status">
        {statusLabel[order.status]}
      </p>
      <p className="text-text-muted">{statusDescription[order.status]}</p>

      {!stoppedEarly && (
        <ol className="mt-5 space-y-0" aria-label="Avance del pedido">
          {steps.map((s, i) => {
            const done = i <= current;
            const date = when(s.status);
            return (
              <li key={s.status} aria-current={i === current ? "step" : undefined} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden
                    className={cn(
                      "inline-flex size-7 items-center justify-center rounded-full border-2",
                      done ? "border-state-success bg-state-success text-brand-white" : "border-border-strong text-text-muted",
                    )}
                  >
                    {done && <Check size={16} strokeWidth={2.5} />}
                  </span>
                  {i < steps.length - 1 && <span aria-hidden className={cn("w-0.5 flex-1", i < current ? "bg-state-success" : "bg-border")} />}
                </div>
                <div className="pb-6">
                  <p className={cn("font-medium", !done && "text-text-muted")}>
                    {s.label}
                    <span className="sr-only">{done ? " (listo)" : " (pendiente)"}</span>
                  </p>
                  {date && done && <p className="text-sm text-text-muted">{formatDateTime(date)}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

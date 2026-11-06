import { formatGTQ } from "@/lib/money";
import type { TransferSettings } from "@/lib/transfer";
import { CopyButton } from "./copy-button";

/** Datos para pagar por transferencia: cuenta, monto exacto y la referencia que identifica el pedido. */
export function TransferInstructions({ bank, total, code }: { bank: TransferSettings; total: number; code: string }) {
  const rows: { label: string; value: string; copy?: boolean }[] = [
    { label: "Banco", value: bank.bankName },
    { label: "Titular de la cuenta", value: bank.accountName },
    { label: "Número de cuenta", value: bank.accountNumber, copy: true },
    ...(bank.accountType ? [{ label: "Tipo de cuenta", value: bank.accountType }] : []),
    { label: "Monto exacto", value: formatGTQ(total) },
    { label: "Referencia (escríbela en la transferencia)", value: code, copy: true },
  ];
  return (
    <section aria-labelledby="datos-transferencia" className="mt-6 rounded-lg border border-border p-5">
      <h2 id="datos-transferencia" className="text-lg">
        Datos para tu transferencia
      </h2>
      <ul className="mt-3 divide-y divide-border">
        {rows.map((r) => (
          <li key={r.label} className="flex flex-wrap items-center justify-between gap-x-4 py-2">
            <span className="text-text-muted">{r.label}</span>
            <span className="flex items-center gap-1">
              <strong className="break-all font-medium tabular-nums">{r.value}</strong>
              {r.copy && <CopyButton value={r.value} label={r.label.split(" (")[0].toLowerCase()} />}
            </span>
          </li>
        ))}
      </ul>
      {bank.instructions && <p className="mt-3 text-text-muted">{bank.instructions}</p>}
    </section>
  );
}

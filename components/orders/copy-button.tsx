"use client";

import { useState } from "react";

/** Copia un texto al portapapeles y avisa con un mensaje que lee el lector de pantalla. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* sin portapapeles: la persona puede seleccionar el texto */
          }
        }}
        className="inline-flex min-h-11 items-center rounded-md px-2 text-sm text-brand-primary-strong underline underline-offset-2"
      >
        {copied ? "Copiado" : "Copiar"}
        <span className="sr-only"> {label}</span>
      </button>
      <span role="status" className="sr-only">
        {copied ? `${label} copiado` : ""}
      </span>
    </>
  );
}

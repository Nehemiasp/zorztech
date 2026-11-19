"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";

/**
 * Copia un texto al portapapeles y avisa con un mensaje que lee el lector de pantalla.
 * «link» es el enlace discreto junto a un dato; «button» es un botón con ícono para la acción principal de un bloque.
 */
export function CopyButton({ value, label, variant = "link", text = "Copiar" }: { value: string; label: string; variant?: "link" | "button"; text?: string }) {
  const [copied, setCopied] = useState(false);
  const Icon = copied ? Check : Copy;
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
        className={
          variant === "button"
            ? buttonStyles("secondary-light", "shrink-0")
            : "inline-flex min-h-11 items-center rounded-md px-2 text-sm text-brand-primary-strong underline underline-offset-2"
        }
      >
        {variant === "button" && <Icon aria-hidden size={18} strokeWidth={2} className={copied ? "text-state-success" : undefined} />}
        {copied ? "Copiado" : text}
        <span className="sr-only"> {label}</span>
      </button>
      <span role="status" className="sr-only">
        {copied ? `${label} copiado` : ""}
      </span>
    </>
  );
}

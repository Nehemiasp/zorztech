"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buttonStyles } from "@/components/ui/button";

const MAX_SIDE = 1600;

/** Reduce una foto grande antes de subirla: un comprobante se lee igual a 1600 px y pesa una fracción. */
async function shrink(file: File): Promise<File> {
  if (file.size < 400 * 1024 || !/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob && blob.size < file.size ? new File([blob], "comprobante.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

interface Props {
  code: string;
  /** Firma del enlace directo, si la persona llegó por él. */
  token?: string;
  count: number;
  max: number;
}

/** Sube el comprobante de una transferencia y lista los que ya se enviaron. */
export function ProofUpload({ code, token, count, max }: Props) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const suffix = token ? `?t=${encodeURIComponent(token)}` : "";

  async function send() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const body = new FormData();
      body.set("archivo", await shrink(file));
      if (token) body.set("t", token);
      const res = await fetch(`/api/pedidos/${encodeURIComponent(code)}/comprobante`, { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No pudimos subir el comprobante. Inténtalo de nuevo.");
      } else {
        setFile(null);
        if (input.current) input.current.value = "";
        setDone(true);
        router.refresh();
      }
    } catch {
      setError("No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.");
    }
    setBusy(false);
  }

  return (
    <section aria-labelledby="comprobante-titulo" className="mt-6 rounded-lg border border-border p-5">
      <h2 id="comprobante-titulo" className="text-lg">
        Comprobante de tu transferencia
      </h2>
      <p className="mt-1 text-text-muted">Sube una foto o captura del comprobante para que confirmemos tu pago más rápido. Es opcional.</p>

      {count > 0 && (
        <ul className="mt-3 space-y-1">
          {Array.from({ length: count }, (_, i) => (
            <li key={i}>
              <a href={`/api/pedidos/${encodeURIComponent(code)}/comprobante/${i}${suffix}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-brand-primary-strong underline underline-offset-2">
                Ver comprobante {i + 1}
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {count < max ? (
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="archivo-comprobante" className="mb-1 block font-medium">
              Foto o captura (JPG, PNG o WebP)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={input}
                id="archivo-comprobante"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setError(null);
                  setDone(false);
                }}
                className="peer sr-only"
              />
              <label
                htmlFor="archivo-comprobante"
                className={`${buttonStyles("secondary-light")} cursor-pointer peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-primary`}
              >
                Elegir archivo
              </label>
              <span className="min-w-0 break-all text-text-muted">{file ? file.name : "Ningún archivo seleccionado"}</span>
            </div>
          </div>
          <button type="button" onClick={send} disabled={!file || busy} className={buttonStyles("primary")}>
            {busy ? "Subiendo…" : "Enviar comprobante"}
          </button>
        </div>
      ) : (
        <p className="mt-3 text-text-muted">Ya enviaste {max} comprobantes. Si necesitas mandar otro, escríbenos.</p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-state-error">
          {error}
        </p>
      )}
      <p role="status" className="mt-3 text-state-success">
        {done ? "Recibimos tu comprobante. En cuanto confirmemos el depósito te avisamos por correo." : ""}
      </p>
    </section>
  );
}

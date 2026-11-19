import { defaultContact, getStoreSettings } from "../settings";
import { buildResendPayload, type EmailMessage } from "./payload";

export { buildResendPayload, EMAIL_FROM, FOOTER_MARK, footerText, type EmailMessage } from "./payload";

/** Correo de contacto vigente (panel → Configuración → Contacto). Si no se puede leer, el de partida. */
async function contactEmail(): Promise<string | null> {
  try {
    const { contact } = await getStoreSettings();
    return contact.email.trim() || null;
  } catch {
    return defaultContact.email || null;
  }
}

/**
 * Envía un correo con Resend. Sin RESEND_API_KEY (desarrollo) lo escribe en la consola.
 * Nunca lanza: un correo que falla no debe tumbar un pago ni un cambio de estado.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const payload = buildResendPayload(message, await contactEmail());
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[correo] De: ${payload.from} | Para: ${message.to}${payload.cc ? ` | Cc: ${payload.cc.join(", ")}` : ""}${payload.attachments ? ` | Adjuntos: ${payload.attachments.map((a) => a.filename).join(", ")}` : ""} | Asunto: ${message.subject}\n${payload.text}`);
    return true;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      // Solo el tipo de error: el mensaje de Resend puede repetir direcciones de correo.
      const body = (await res.json().catch(() => null)) as { name?: string } | null;
      console.error(`[correo] Resend respondió ${res.status}${body?.name ? ` (${body.name})` : ""}`);
    }
    return res.ok;
  } catch (error) {
    console.error("[correo] No se pudo enviar", error instanceof Error ? error.message : "error desconocido");
    return false;
  }
}

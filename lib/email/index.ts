export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Envía un correo con Resend. Sin RESEND_API_KEY (desarrollo) lo escribe en la consola.
 * Nunca lanza: un correo que falla no debe tumbar un pago ni un cambio de estado.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[correo] Para: ${message.to} | Asunto: ${message.subject}\n${message.text}`);
    return true;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "ZorzTech <no-responder@example.com>",
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });
    if (!res.ok) console.error(`[correo] Resend respondió ${res.status}`);
    return res.ok;
  } catch (error) {
    console.error("[correo] No se pudo enviar", error instanceof Error ? error.message : "error desconocido");
    return false;
  }
}

// Partes puras del envío (sin base de datos), para poder probarlas solas.

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  /**
   * Copia a la tienda (cc al correo de contacto). Viene activada; se apaga en correos que no deben salir de las
   * manos del cliente, como el enlace para cambiar la contraseña.
   */
  copyToStore?: boolean;
}

/** Remitente único de la tienda. Resend solo acepta direcciones del dominio verificado (zorztech.com). */
export const EMAIL_FROM = "ZorzTech <no-reply@zorztech.com>";

/** Lugar del pie en el HTML de las plantillas (ver layout en templates.ts); aquí se completa con el contacto del panel. */
export const FOOTER_MARK = "<!--zt-pie-->";

const esc = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const isEmail = (value: string) => /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(value);

export function footerText(contactEmail: string | null): string {
  return contactEmail
    ? `Este correo es automático, no lo respondas. Si necesitas ayuda, escríbenos a ${contactEmail}.`
    : "Este correo es automático, no lo respondas.";
}

/**
 * Arma lo que se manda a Resend: remitente fijo de zorztech.com, pie con el correo de contacto, copia a la tienda
 * y respuestas dirigidas al contacto (por si el cliente responde de todos modos).
 */
export function buildResendPayload(message: EmailMessage, contactEmail: string | null) {
  const contact = contactEmail && isEmail(contactEmail) ? contactEmail : null;
  const footer = footerText(contact);
  const footerHtml = esc(footer);
  const html = message.html.includes(FOOTER_MARK)
    ? message.html.replace(FOOTER_MARK, footerHtml)
    : message.html.replace("</body>", `<p style="font-size:13px;color:#55627a">${footerHtml}</p></body>`);
  const copy = message.copyToStore !== false && contact && contact.toLowerCase() !== message.to.toLowerCase();

  return {
    from: EMAIL_FROM,
    to: [message.to],
    ...(copy ? { cc: [contact] } : {}),
    ...(contact ? { reply_to: contact } : {}),
    subject: message.subject,
    html,
    text: `${message.text}\n\n—\n${footer}`,
  };
}


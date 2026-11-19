import { formatGTQ } from "../money";
import { statusLabel, timelineIndex, timelineSteps } from "../orders/status";
import { siteConfig } from "../site";
import { FOOTER_MARK, type EmailMessage } from "./payload";
import type { OrderStatus, ShippingMethod } from "../generated/prisma/client";
import type { TransferSettings } from "../transfer";

// Los correos no pueden usar variables CSS: los colores de la marca se repiten aquí, en un solo lugar.
const color = {
  ink: "#0a1220",
  muted: "#55627a",
  line: "#d9dfea",
  navy: "#0b1728",
  action: "#0563f1",
  accent: "#4cb5fb",
  soft: "#f2f5fa",
  tint: "#eaf2fe",
  success: "#0b7a4b",
};
const font = "Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif";

const esc = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export interface OrderEmailData {
  code: string;
  customerName: string;
  email: string;
  status: OrderStatus;
  shippingMethod: ShippingMethod;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  items: { productName: string; variantName: string; unitPrice: number; quantity: number }[];
  pickupLocation?: { name: string; address: string; hours: string } | null;
  /** Enlace directo para ver el pedido sin iniciar sesión. Si falta, se usa el seguimiento con código y correo. */
  viewUrl?: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  /** La guía (foto o PDF) va adjunta al correo. */
  guideAttached?: boolean;
}

interface LayoutOptions {
  /** Texto corto que la bandeja de entrada muestra junto al asunto. */
  preheader?: string;
  /** Etiqueta sobre el título, por ejemplo el código del pedido. */
  eyebrow?: string;
}

/**
 * Plantilla común: encabezado azul marino con el logo, contenido en tarjeta blanca y pie con enlaces.
 * Tablas y estilos en línea, que es lo que entienden todos los clientes de correo (Gmail, Outlook, Apple Mail).
 * El pie con el correo de contacto lo completa el envío (FOOTER_MARK).
 */
function layout(title: string, bodyHtml: string, options: LayoutOptions = {}): string {
  const logo = `${siteConfig.url}/brand/zorztech-logo-correo.png`;
  const footerLink = (href: string, label: string) => `<a href="${esc(href)}" style="color:${color.muted};text-decoration:underline">${label}</a>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${color.soft};font-family:${font};color:${color.ink};-webkit-text-size-adjust:100%">
${options.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(options.preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${color.soft}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
<tr><td style="background:${color.navy};background-color:${color.navy};border-radius:14px 14px 0 0;padding:22px 32px" bgcolor="${color.navy}">
<a href="${esc(siteConfig.url)}" style="text-decoration:none"><img src="${esc(logo)}" width="180" height="36" alt="${esc(siteConfig.name)}" style="display:block;border:0;width:180px;height:36px;color:#ffffff;font-size:22px;font-weight:700;line-height:36px"></a>
</td></tr>
<tr><td style="height:4px;line-height:4px;font-size:0;background:${color.action}" bgcolor="${color.action}">&nbsp;</td></tr>
<tr><td style="background:#ffffff;padding:32px 32px 28px;border-radius:0 0 14px 14px" bgcolor="#ffffff">
${options.eyebrow ? `<p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:${color.action}">${esc(options.eyebrow)}</p>` : ""}
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;font-weight:700;color:${color.ink}">${esc(title)}</h1>
${bodyHtml}
</td></tr>
<tr><td style="padding:20px 32px 8px;font-size:13px;line-height:1.6;color:${color.muted};text-align:center">${FOOTER_MARK}</td></tr>
<tr><td style="padding:0 32px 24px;font-size:13px;line-height:1.6;color:${color.muted};text-align:center">
${footerLink(`${siteConfig.url}/pedido/seguimiento`, "Seguir mi pedido")} · ${footerLink(`${siteConfig.url}/terminos`, "Términos")} · ${footerLink(`${siteConfig.url}/privacidad`, "Privacidad")}<br>${esc(siteConfig.name)} · Guatemala
</td></tr>
</table></td></tr></table></body></html>`;
}

const paragraph = (text: string) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${color.ink}">${esc(text)}</p>`;
const note = (html: string) => `<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:${color.muted}">${html}</p>`;

/** Recuadro destacado (fondo azul muy claro) con etiqueta y contenido. */
function panel(label: string, innerHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:${color.tint};border-radius:10px" bgcolor="${color.tint}"><tr><td style="padding:16px 20px">
<p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:${color.muted}">${esc(label)}</p>${innerHtml}</td></tr></table>`;
}

/** Avance del pedido en cuatro pasos (pagado, preparación, enviado o listo, entregado). */
function progress(order: OrderEmailData): string {
  const current = timelineIndex(order.status);
  if (current < 0) return "";
  const steps = timelineSteps(order.shippingMethod);
  const cells = steps
    .map((step, i) => {
      const done = i <= current;
      const dot = done
        ? `<span style="display:inline-block;width:26px;height:26px;line-height:26px;border-radius:13px;background:${color.action};color:#ffffff;font-size:14px;font-weight:700">&#10003;</span>`
        : `<span style="display:inline-block;width:22px;height:22px;line-height:22px;border-radius:13px;border:2px solid ${color.line};color:${color.muted};font-size:12px">${i + 1}</span>`;
      return `<td width="25%" align="center" valign="top" style="padding:0 4px">${dot}<p style="margin:6px 0 0;font-size:12px;line-height:1.3;color:${done ? color.ink : color.muted};font-weight:${i === current ? 700 : 400}">${esc(step.label)}</p></td>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 24px"><tr>${cells}</tr></table>`;
}

function itemsTable(order: OrderEmailData): string {
  const rows = order.items
    .map(
      (i) => `<tr><td style="padding:12px 0;border-bottom:1px solid ${color.line};font-size:15px;line-height:1.4">${esc(i.productName)}${
        i.variantName ? `<br><span style="color:${color.muted};font-size:13px">${esc(i.variantName)}</span>` : ""
      }<br><span style="color:${color.muted};font-size:13px">${i.quantity} × ${formatGTQ(i.unitPrice)}</span></td><td align="right" valign="top" style="padding:12px 0 12px 12px;border-bottom:1px solid ${color.line};font-size:15px;white-space:nowrap">${formatGTQ(i.unitPrice * i.quantity)}</td></tr>`,
    )
    .join("");
  const line = (label: string, value: string) =>
    `<tr><td style="padding:4px 0;font-size:14px;color:${color.muted}">${label}</td><td align="right" style="padding:4px 0;font-size:14px;color:${color.ink}">${value}</td></tr>`;
  return `<p style="margin:8px 0 4px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:${color.muted}">Tu pedido</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
<tr><td colspan="2" style="height:8px;line-height:8px;font-size:0">&nbsp;</td></tr>
${line("Subtotal", formatGTQ(order.subtotal))}
${order.discount > 0 ? line("Descuento", `-${formatGTQ(order.discount)}`) : ""}
${line("Envío", order.shippingCost > 0 ? formatGTQ(order.shippingCost) : "Sin costo")}
<tr><td style="padding:10px 0 0;border-top:1px solid ${color.line};font-size:17px;font-weight:700">Total</td><td align="right" style="padding:10px 0 0;border-top:1px solid ${color.line};font-size:17px;font-weight:700">${formatGTQ(order.total)}</td></tr>
</table>`;
}

function itemsText(order: OrderEmailData): string {
  return [
    ...order.items.map((i) => `- ${i.productName}${i.variantName ? ` (${i.variantName})` : ""} × ${i.quantity}: ${formatGTQ(i.unitPrice * i.quantity)}`),
    `Subtotal: ${formatGTQ(order.subtotal)}`,
    ...(order.discount > 0 ? [`Descuento: -${formatGTQ(order.discount)}`] : []),
    `Envío: ${order.shippingCost > 0 ? formatGTQ(order.shippingCost) : "Sin costo"}`,
    `Total: ${formatGTQ(order.total)}`,
  ].join("\n");
}

const trackingUrl = () => `${siteConfig.url}/pedido/seguimiento`;

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0"><tr><td style="border-radius:8px;background:${color.action}" bgcolor="${color.action}">
<a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-family:${font};font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px">${esc(label)}</a></td></tr></table>`;
}

const intro: Record<string, (o: OrderEmailData) => { title: string; text: string }> = {
  pagado: (o) => ({
    title: "Recibimos tu pago",
    text: `Hola ${o.customerName}, tu pedido ${o.code} está pagado. Pronto empezamos a prepararlo.`,
  }),
  en_preparacion: (o) => ({ title: "Estamos preparando tu pedido", text: `Hola ${o.customerName}, tu pedido ${o.code} está en preparación.` }),
  enviado: (o) => ({ title: "Tu pedido va en camino", text: `Hola ${o.customerName}, enviamos tu pedido ${o.code}.` }),
  listo_para_recoger: (o) => ({
    title: "Tu pedido está listo para recoger",
    text: `Hola ${o.customerName}, tu pedido ${o.code} ya te espera en la tienda.`,
  }),
  entregado: (o) => ({ title: "Entregamos tu pedido", text: `Hola ${o.customerName}, tu pedido ${o.code} fue entregado. Gracias por comprar.` }),
  cancelado: (o) => ({
    title: "Cancelamos tu pedido",
    text: `Hola ${o.customerName}, el pedido ${o.code} fue cancelado. Si ya habías pagado, te contactaremos para devolverte el dinero.`,
  }),
  reembolsado: (o) => ({
    title: "Te devolvimos el dinero",
    text: `Hola ${o.customerName}, reembolsamos el pedido ${o.code}. El dinero puede tardar unos días en reflejarse.`,
  }),
  pago_fallido: (o) => ({
    title: "No pudimos procesar tu pago",
    text: `Hola ${o.customerName}, el pago del pedido ${o.code} no se completó. Tus productos siguen apartados por un tiempo limitado: puedes intentarlo de nuevo.`,
  }),
};

/** Correo al cliente cuando su pedido cambia de estado. Devuelve null si ese estado no genera correo. */
export function orderStatusEmail(order: OrderEmailData): EmailMessage | null {
  const make = intro[order.status];
  if (!make) return null;
  const { title, text } = make(order);
  const pickup =
    order.shippingMethod === "recogida" && order.pickupLocation && ["pagado", "listo_para_recoger", "en_preparacion"].includes(order.status)
      ? panel(
          "Dónde recoger",
          `<p style="margin:0;font-size:15px;line-height:1.5;color:${color.ink}"><strong>${esc(order.pickupLocation.name)}</strong><br>${esc(order.pickupLocation.address)}<br><span style="color:${color.muted}">Horario: ${esc(order.pickupLocation.hours)}</span></p>`,
        )
      : "";
  const pickupText =
    pickup && order.pickupLocation
      ? `\nDónde recoger: ${order.pickupLocation.name}, ${order.pickupLocation.address}. Horario: ${order.pickupLocation.hours}.`
      : "";
  const guide = order.status === "enviado" && order.trackingNumber ? `${order.trackingNumber}${order.carrier ? ` (${order.carrier})` : ""}` : "";
  const attachedNote = guide && order.guideAttached ? "Te adjuntamos la guía de envío en este correo." : "";
  const guideHtml = guide
    ? panel(
        "Número de guía",
        `<p style="margin:0;font-size:22px;line-height:1.3;font-weight:700;letter-spacing:.03em;color:${color.ink}">${esc(order.trackingNumber!)}</p>${
          order.carrier ? `<p style="margin:2px 0 0;font-size:14px;color:${color.muted}">${esc(order.carrier)}</p>` : ""
        }${attachedNote ? `<p style="margin:10px 0 0;font-size:14px;color:${color.success}">&#128206; ${attachedNote}</p>` : ""}`,
      )
    : "";
  const guideText = guide ? `\nNúmero de guía: ${guide}${attachedNote ? `\n${attachedNote}` : ""}` : "";
  const action = order.viewUrl ?? (order.status === "pago_fallido" ? `${siteConfig.url}/pedido/${order.code}/confirmacion` : trackingUrl());
  const actionLabel = order.status === "pago_fallido" ? "Intentar de nuevo" : "Seguir mi pedido";

  return {
    to: order.email,
    subject: `${statusLabel[order.status]}: pedido ${order.code}`,
    html: layout(
      title,
      `${paragraph(text)}${progress(order)}${guideHtml}${pickup}${itemsTable(order)}${button(action, actionLabel)}${note(`Para seguir tu pedido sin cuenta, usa el código <strong>${esc(order.code)}</strong> y este correo.`)}`,
      { preheader: text, eyebrow: `Pedido ${order.code}` },
    ),
    text: `${title}\n\n${text}${guideText}\n\n${itemsText(order)}${pickupText}\n\n${actionLabel}: ${action}\nPara seguir tu pedido sin cuenta usa el código ${order.code} y este correo.`,
  };
}

const dateTimeGT = new Intl.DateTimeFormat("es-GT", { dateStyle: "long", timeStyle: "short", timeZone: "America/Guatemala" });

/** Correo con los datos de la cuenta, el monto y la referencia para quien eligió pagar por transferencia. */
export function transferInstructionsEmail(order: OrderEmailData, bank: TransferSettings, deadline: Date | null, contactEmail: string): EmailMessage {
  const title = "Tu pedido está apartado: falta tu transferencia";
  const until = deadline ? ` Apartamos tus productos hasta el ${dateTimeGT.format(deadline).replace(/[.\s]+$/, "")}.` : "";
  const text = `Hola ${order.customerName}, recibimos tu pedido ${order.code}. Para completarlo, transfiere ${formatGTQ(order.total)} a la cuenta de abajo y escribe el código ${order.code} como referencia.${until} Cuando recibamos el dinero te avisamos por correo.`;
  const rows: [string, string][] = [
    ["Banco", bank.bankName],
    ["Titular", bank.accountName],
    ["Número de cuenta", bank.accountNumber],
    ...(bank.accountType ? ([["Tipo de cuenta", bank.accountType]] as [string, string][]) : []),
    ["Monto", formatGTQ(order.total)],
    ["Referencia", order.code],
  ];
  const table = panel(
    "Datos para transferir",
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 0;font-size:14px;color:${color.muted}">${esc(k)}</td><td align="right" style="padding:6px 0;font-size:15px;font-weight:700;color:${color.ink}">${esc(v)}</td></tr>`,
      )
      .join("")}</table>`,
  );
  const extra = bank.instructions ? paragraph(bank.instructions) : "";
  const proof = note(`¿Ya transferiste? Puedes subir tu comprobante desde tu pedido o enviarlo a ${esc(contactEmail)} con el código <strong>${esc(order.code)}</strong>.`);
  return {
    to: order.email,
    subject: `Transferencia pendiente: pedido ${order.code}`,
    html: layout(title, `${paragraph(text)}${table}${extra}${itemsTable(order)}${button(order.viewUrl ?? trackingUrl(), "Ver mi pedido")}${proof}`, {
      preheader: `Transfiere ${formatGTQ(order.total)} con la referencia ${order.code} para completar tu pedido.`,
      eyebrow: `Pedido ${order.code}`,
    }),
    text: `${title}\n\n${text}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}${bank.instructions ? `\n\n${bank.instructions}` : ""}\n\n${itemsText(order)}\n\nVer mi pedido: ${order.viewUrl ?? trackingUrl()}\n¿Ya transferiste? Envía tu comprobante a ${contactEmail} con el código ${order.code}.`,
  };
}

export function passwordResetEmail(to: string, name: string, url: string): EmailMessage {
  const text = `Hola ${name}, recibimos una solicitud para cambiar tu contraseña. El enlace funciona durante 1 hora. Si no fuiste tú, ignora este correo.`;
  return {
    to,
    // Sin copia a la tienda: el enlace permite cambiar la contraseña y solo debe llegarle al cliente.
    copyToStore: false,
    subject: "Cambia tu contraseña de ZorzTech",
    html: layout("Cambia tu contraseña", `${paragraph(text)}${button(url, "Elegir nueva contraseña")}`, { preheader: "El enlace para elegir tu nueva contraseña funciona durante 1 hora." }),
    text: `${text}\n\nElegir nueva contraseña: ${url}`,
  };
}

export function restockEmail(to: string, productName: string, variantName: string, url: string): EmailMessage {
  const label = variantName ? `${productName} (${variantName})` : productName;
  const text = `Ya hay unidades de ${label}. Las existencias son limitadas: si lo quieres, no esperes mucho.`;
  return {
    to,
    subject: `Ya llegó: ${productName}`,
    html: layout(
      "Ya llegó lo que esperabas",
      `${paragraph(text)}${panel("Producto", `<p style="margin:0;font-size:16px;font-weight:700;color:${color.ink}">${esc(label)}</p>`)}${button(url, "Ver el producto")}${note("Te escribimos solo esta vez porque pediste que te avisáramos.")}`,
      { preheader: `Ya hay unidades de ${label}.`, eyebrow: "Aviso de disponibilidad" },
    ),
    text: `${text}\n\nVer el producto: ${url}\nTe escribimos solo esta vez porque pediste que te avisáramos.`,
  };
}

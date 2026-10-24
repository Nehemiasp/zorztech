import { formatGTQ } from "../money";
import { statusLabel } from "../orders/status";
import { siteConfig } from "../site";
import type { EmailMessage } from "./index";
import type { OrderStatus, ShippingMethod } from "../generated/prisma/client";

// Los correos no pueden usar variables CSS: los colores de la marca se repiten aquí, en un solo lugar.
const color = { ink: "#0a1220", muted: "#55627a", line: "#d9dfea", navy: "#0b1728", action: "#0563f1", soft: "#f2f5fa" };

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
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="es"><body style="margin:0;background:${color.soft};font-family:Arial,Helvetica,sans-serif;color:${color.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden">
<tr><td style="background:${color.navy};padding:20px 24px;color:#ffffff;font-size:20px;font-weight:bold">${esc(siteConfig.name)}</td></tr>
<tr><td style="padding:24px"><h1 style="margin:0 0 16px;font-size:22px">${esc(title)}</h1>${bodyHtml}</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid ${color.line};font-size:13px;color:${color.muted}">Este correo es una notificación de tu compra en ${esc(siteConfig.name)}.</td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(order: OrderEmailData): string {
  const rows = order.items
    .map(
      (i) => `<tr><td style="padding:8px 0;border-bottom:1px solid ${color.line}">${esc(i.productName)}${
        i.variantName ? `<br><span style="color:${color.muted};font-size:13px">${esc(i.variantName)}</span>` : ""
      }</td><td align="center" style="padding:8px 8px;border-bottom:1px solid ${color.line}">${i.quantity}</td><td align="right" style="padding:8px 0;border-bottom:1px solid ${color.line}">${formatGTQ(i.unitPrice * i.quantity)}</td></tr>`,
    )
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td colspan="2" style="padding:4px 0;${bold ? "font-weight:bold;font-size:16px" : "color:" + color.muted}">${label}</td><td align="right" style="padding:4px 0;${bold ? "font-weight:bold;font-size:16px" : ""}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}
${line("Subtotal", formatGTQ(order.subtotal))}
${order.discount > 0 ? line("Descuento", `-${formatGTQ(order.discount)}`) : ""}
${line("Envío", order.shippingCost > 0 ? formatGTQ(order.shippingCost) : "Sin costo")}
${line("Total", formatGTQ(order.total), true)}</table>`;
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
  return `<p style="margin:24px 0 0"><a href="${esc(href)}" style="background:${color.action};color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:bold">${esc(label)}</a></p>`;
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
      ? `<p style="margin:16px 0 0"><strong>Dónde recoger:</strong> ${esc(order.pickupLocation.name)}, ${esc(order.pickupLocation.address)}. Horario: ${esc(order.pickupLocation.hours)}.</p>`
      : "";
  const pickupText =
    pickup && order.pickupLocation
      ? `\nDónde recoger: ${order.pickupLocation.name}, ${order.pickupLocation.address}. Horario: ${order.pickupLocation.hours}.`
      : "";
  const action = order.status === "pago_fallido" ? `${siteConfig.url}/pedido/${order.code}/confirmacion` : trackingUrl();
  const actionLabel = order.status === "pago_fallido" ? "Intentar de nuevo" : "Seguir mi pedido";

  return {
    to: order.email,
    subject: `${statusLabel[order.status]}: pedido ${order.code}`,
    html: layout(
      title,
      `<p style="margin:0 0 16px;line-height:1.5">${esc(text)}</p>${itemsTable(order)}${pickup}${button(action, actionLabel)}<p style="font-size:13px;color:${color.muted};margin:16px 0 0">Para seguir tu pedido sin cuenta, usa el código ${esc(order.code)} y este correo.</p>`,
    ),
    text: `${title}\n\n${text}\n\n${itemsText(order)}${pickupText}\n\n${actionLabel}: ${action}\nPara seguir tu pedido sin cuenta usa el código ${order.code} y este correo.`,
  };
}

export function passwordResetEmail(to: string, name: string, url: string): EmailMessage {
  const text = `Hola ${name}, recibimos una solicitud para cambiar tu contraseña. El enlace funciona durante 1 hora. Si no fuiste tú, ignora este correo.`;
  return {
    to,
    subject: "Cambia tu contraseña de ZorzTech",
    html: layout("Cambia tu contraseña", `<p style="margin:0;line-height:1.5">${esc(text)}</p>${button(url, "Elegir nueva contraseña")}`),
    text: `${text}\n\nElegir nueva contraseña: ${url}`,
  };
}

export function restockEmail(to: string, productName: string, variantName: string, url: string): EmailMessage {
  const label = variantName ? `${productName} (${variantName})` : productName;
  const text = `Ya hay unidades de ${label}. Las existencias son limitadas: si lo quieres, no esperes mucho.`;
  return {
    to,
    subject: `Ya llegó: ${productName}`,
    html: layout("Ya llegó lo que esperabas", `<p style="margin:0;line-height:1.5">${esc(text)}</p>${button(url, "Ver el producto")}<p style="font-size:13px;color:${color.muted};margin:16px 0 0">Te escribimos solo esta vez porque pediste que te avisáramos.</p>`),
    text: `${text}\n\nVer el producto: ${url}\nTe escribimos solo esta vez porque pediste que te avisáramos.`,
  };
}

export const siteConfig = {
  name: "ZorzTech",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  description:
    "Compra celulares, laptops, audio, gaming y hogar inteligente. Precios en quetzales, envío a domicilio o recogida en tienda y seguimiento de tu pedido.",
} as const;

/** Datos que debe entregar el dueño de la tienda. Se muestran como marcadores visibles hasta entonces. */
export const pendingData = {
  phone: "[Teléfono]",
  email: "[Correo de contacto]",
  hours: "[Horario de atención]",
  socials: "[Redes sociales]",
  paymentMethods: "[Métodos de pago por confirmar]",
  warranty: "[Garantía del producto]",
  deliveryTime: "[Tiempo de entrega]",
} as const;

const TITLE_SUFFIX = " | ZorzTech";

/** Primer título de la lista que cabe en 60 caracteres con el sufijo de la marca. */
export function fitTitle(...candidates: string[]): string {
  const max = 60 - TITLE_SUFFIX.length;
  return candidates.find((c) => c.length <= max) ?? candidates[candidates.length - 1];
}

/** Recorta en el límite de una palabra y agrega "…" si hace falta. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

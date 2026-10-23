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
} as const;

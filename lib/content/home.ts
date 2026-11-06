// Textos del inicio. Propuesta de redacción: el dueño debe validarlos.
// El hero se edita desde el panel (Configuración). Estos son los valores por defecto cuando no hay un banner activo.

export const hero: {
  title: string;
  body: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  image: { src: string; alt: string };
  /** Versión vertical para celular. Sin ella, el celular usa la imagen horizontal. */
  imageMobile?: { src: string };
} = {
  title: "Compra tecnología sabiendo qué pagas y cuándo llega",
  body: "Celulares, laptops, audio, gaming y hogar inteligente. Precios en quetzales, envío a todo el país y seguimiento de tu pedido.",
  primaryCta: { label: "Explorar categorías", href: "#categorias" },
  secondaryCta: { label: "Seguir mi pedido", href: "/pedido/seguimiento" },
  image: {
    src: "/img/promo/banner-gaming.webp",
    alt: "Equipo gaming con monitor, torre con ventiladores de colores, teclado, mouse, audífonos y tarjeta gráfica",
  },
  imageMobile: { src: "/img/promo/banner-gaming-movil.webp" },
};

export const trust = [
  {
    title: "Entrega",
    body: "Enviamos a todo el país con una sola tarifa, gratis en compras grandes. El costo se ve antes de pagar.",
  },
  {
    title: "Seguimiento",
    body: "Consulta el estado de tu pedido con su código y tu correo, sin necesidad de crear una cuenta.",
  },
  {
    title: "Pago",
    body: "Pagas en línea y en quetzales. Si el pago queda pendiente, te lo decimos en la confirmación.",
    pending: "paymentMethods",
  },
  {
    title: "Atención",
    body: "Escríbenos si tienes dudas antes o después de comprar.",
    pending: "hours",
  },
] as const;

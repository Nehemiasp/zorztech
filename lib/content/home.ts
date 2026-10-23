// Textos del inicio. Propuesta de redacción: el dueño debe validarlos.
// El hero es editable desde el panel (fase 4); mientras tanto vive aquí.

export const hero = {
  title: "Compra tecnología sabiendo qué pagas y cuándo llega",
  body: "Celulares, laptops, audio, gaming y hogar inteligente. Precios en quetzales, entrega a domicilio o recogida en tienda.",
  primaryCta: { label: "Explorar categorías", href: "#categorias" },
  secondaryCta: { label: "Seguir mi pedido", href: "/pedido/seguimiento" },
  image: {
    src: "/img/placeholder/hero-producto-1x1.svg",
    alt: "Espacio reservado para la foto del producto de la promoción",
  },
} as const;

export const trust = [
  {
    title: "Entrega",
    body: "A domicilio, con tarifa según tu departamento, o recogida en tienda. El costo se calcula antes de pagar.",
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

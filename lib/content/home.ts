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
    src: "/img/promo/banner-escritorio.webp",
    alt: "Equipo gaming con monitor curvo, torre con ventiladores de colores, tarjeta gráfica, procesador, teclado, mouse y audífonos",
  },
  imageMobile: { src: "/img/promo/banner-movil.webp" },
};

/** Frase de cada categoría para los banners del inicio. Una categoría sin frase muestra solo su nombre. */
export const categoryTaglines: Record<string, string> = {
  celulares: "Celulares para el día a día",
  laptops: "Laptops para estudiar y trabajar",
  audio: "Audífonos y sonido para todos los días",
  accesorios: "Accesorios que sí vas a usar",
  gaming: "Todo para jugar mejor",
  "hogar-inteligente": "Tu casa, más inteligente",
  tablets: "Tablets para ver, leer y crear",
  monitores: "Monitores para trabajar y jugar",
  "componentes-de-pc": "Arma o mejora tu PC",
  almacenamiento: "Más espacio y velocidad para tu equipo",
  redes: "Internet estable en toda tu casa",
  smartwatches: "Tu día, en la muñeca",
};

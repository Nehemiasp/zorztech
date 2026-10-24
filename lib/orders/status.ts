import type { OrderStatus } from "../generated/prisma/client";

/** Transiciones permitidas (sección 7.3 del brief). */
const transitions: Record<OrderStatus, OrderStatus[]> = {
  pendiente_pago: ["pagado", "pago_fallido", "expirado", "cancelado"],
  pago_fallido: ["pagado", "expirado", "cancelado"],
  // Un pago aprobado que llega tarde puede revivir un pedido expirado.
  expirado: ["pagado"],
  pagado: ["en_preparacion", "cancelado"],
  en_preparacion: ["enviado", "listo_para_recoger", "cancelado"],
  enviado: ["entregado"],
  listo_para_recoger: ["entregado"],
  entregado: [],
  cancelado: ["reembolsado"],
  reembolsado: [],
};

export function allowedTransitions(from: OrderStatus): OrderStatus[] {
  return transitions[from];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return transitions[from].includes(to);
}

/** Estados en los que el stock del pedido sigue apartado sin haberse cobrado. */
export const reservedStatuses: OrderStatus[] = ["pendiente_pago", "pago_fallido"];

/** Estados en los que el pedido ya se pagó y el stock salió del inventario. */
export const paidStatuses: OrderStatus[] = ["pagado", "en_preparacion", "enviado", "listo_para_recoger", "entregado"];

export const statusLabel: Record<OrderStatus, string> = {
  pendiente_pago: "Pendiente de pago",
  pago_fallido: "Pago fallido",
  expirado: "Expirado",
  pagado: "Pagado",
  en_preparacion: "En preparación",
  enviado: "Enviado",
  listo_para_recoger: "Listo para recoger",
  entregado: "Entregado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

/** Lo que se le dice al cliente de cada estado. */
export const statusDescription: Record<OrderStatus, string> = {
  pendiente_pago: "Estamos esperando la confirmación de tu pago.",
  pago_fallido: "No pudimos procesar el pago. Puedes intentarlo de nuevo.",
  expirado: "El pedido venció porque no se pagó a tiempo. Los productos volvieron al inventario.",
  pagado: "Recibimos tu pago. Pronto empezamos a preparar tu pedido.",
  en_preparacion: "Estamos preparando tu pedido.",
  enviado: "Tu pedido va en camino.",
  listo_para_recoger: "Tu pedido está listo para que pases por él a la tienda.",
  entregado: "Tu pedido fue entregado.",
  cancelado: "El pedido fue cancelado.",
  reembolsado: "Te devolvimos el dinero de este pedido.",
};

/** Etapas de la línea de tiempo para el cliente, según cómo se entrega el pedido. */
export function timelineSteps(method: "domicilio" | "recogida"): { status: OrderStatus; label: string }[] {
  return [
    { status: "pagado", label: "Pago confirmado" },
    { status: "en_preparacion", label: "En preparación" },
    method === "domicilio"
      ? { status: "enviado", label: "Enviado" }
      : { status: "listo_para_recoger", label: "Listo para recoger" },
    { status: "entregado", label: "Entregado" },
  ];
}

const progress: Partial<Record<OrderStatus, number>> = {
  pagado: 0,
  en_preparacion: 1,
  enviado: 2,
  listo_para_recoger: 2,
  entregado: 3,
};

/** Índice de la etapa actual en la línea de tiempo, o -1 si el pedido no avanzó (sin pagar, cancelado…). */
export function timelineIndex(status: OrderStatus): number {
  return progress[status] ?? -1;
}

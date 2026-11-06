import { db } from "./db";

/** Una tienda con la dirección todavía en marcador («[Dirección de la tienda]») no es real: no se ofrece a los clientes. */
export const isRealPickup = (p: { address: string }) => !p.address.trim().startsWith("[");

/** Tiendas donde un cliente puede recoger hoy. Sin ninguna, la tienda solo ofrece envío a domicilio. */
export async function listAvailablePickups() {
  const rows = await db.pickupLocation.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, address: true, hours: true },
  });
  return rows.filter(isRealPickup);
}

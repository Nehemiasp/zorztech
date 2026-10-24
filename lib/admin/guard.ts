import { getCurrentUser, type CurrentUser } from "../auth";

export const noPermission = { error: "No tienes permiso para hacer esto." } as const;

/**
 * Para acciones del servidor del panel. Una acción es un endpoint público: aunque el botón solo se
 * muestre a administradores, la acción vuelve a comprobar el rol en la base de datos cada vez.
 */
export async function adminUser(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

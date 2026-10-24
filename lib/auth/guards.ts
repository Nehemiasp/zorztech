import { notFound, redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./index";

/** Exige sesión en una página: si no hay, lleva a /ingresar y vuelve después. */
export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar?volver=${encodeURIComponent(returnTo)}`);
  return user;
}

/** Exige rol administrador en una página. A quien no lo es, el panel le responde 404. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?volver=/admin");
  if (user.role !== "admin") notFound();
  return user;
}

/** Para rutas de API y acciones: devuelve el administrador o null (el llamador responde 401/403). */
export async function adminOrNull(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

/** Solo se vuelve a rutas del propio sitio (evita redirecciones abiertas). */
export function safeReturnPath(value: string | null | undefined): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/cuenta";
}

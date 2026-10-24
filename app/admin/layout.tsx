import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/logo";
import { buttonStyles } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel | ZorzTech" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Esta comprobación no basta por sí sola: un layout no se vuelve a ejecutar al navegar entre páginas del panel.
  // Por eso cada página y cada acción vuelven a exigir el rol en el servidor.
  const user = await requireAdmin();
  return (
    <>
      <header className="zone-dark border-b border-border-on-dark bg-surface-dark text-text-on-dark">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-4 md:px-6">
          <Link href="/admin" aria-label="Panel de ZorzTech" className="flex items-center gap-3 rounded-sm">
            <Logo height={28} priority />
            <span className="hidden text-text-on-dark-muted sm:inline">Panel</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex min-h-11 items-center whitespace-nowrap px-2 text-text-on-dark-muted hover:text-text-on-dark">
              Ver tienda
            </Link>
            <span className="hidden text-text-on-dark-muted md:inline">{user.email}</span>
            <form action={logoutAction}>
              <button type="submit" className={buttonStyles("secondary-dark", "min-h-11 whitespace-nowrap px-3 py-1.5")}>
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-page gap-6 px-4 py-6 md:px-6 lg:grid-cols-[13rem_1fr] lg:gap-10">
        <aside className="min-w-0">
          <AdminNav />
        </aside>
        <main id="contenido" className="min-w-0">
          {children}
        </main>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/forms";
import { getCurrentUser } from "@/lib/auth";
import { safeReturnPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Ingresar", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ volver?: string; reiniciada?: string }> }) {
  const { volver, reiniciada } = await searchParams;
  const returnTo = safeReturnPath(volver);
  if (await getCurrentUser()) redirect(returnTo);

  return (
    <div className="mx-auto max-w-md px-4 py-10 md:py-16">
      <h1 className="text-2xl md:text-3xl">Ingresar</h1>
      {reiniciada && (
        <p role="status" className="mt-4 rounded-md border border-state-success p-3 text-state-success">
          Cambiaste tu contraseña. Ingresa con la nueva.
        </p>
      )}
      <p className="mb-6 mt-3 text-text-muted">Con tu cuenta ves tus pedidos y compras más rápido. Tu carrito se conserva al ingresar.</p>
      <LoginForm returnTo={returnTo} googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)} />
    </div>
  );
}

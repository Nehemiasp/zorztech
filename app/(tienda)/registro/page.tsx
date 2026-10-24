import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/forms";
import { getCurrentUser } from "@/lib/auth";
import { safeReturnPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Crear cuenta", robots: { index: false, follow: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const returnTo = safeReturnPath((await searchParams).volver);
  if (await getCurrentUser()) redirect(returnTo);

  return (
    <div className="mx-auto max-w-md px-4 py-10 md:py-16">
      <h1 className="text-2xl md:text-3xl">Crear cuenta</h1>
      <p className="mb-6 mt-3 text-text-muted">Guarda tus direcciones y consulta tus pedidos. Si prefieres, también puedes comprar sin cuenta.</p>
      <RegisterForm returnTo={returnTo} />
    </div>
  );
}

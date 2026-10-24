import type { Metadata } from "next";
import { RecoverForm, ResetForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Recuperar contraseña", robots: { index: false, follow: false } };

export default async function RecoverPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-10 md:py-16">
      <h1 className="mb-6 text-2xl md:text-3xl">{token ? "Elige una nueva contraseña" : "Recuperar contraseña"}</h1>
      {token ? <ResetForm token={token.slice(0, 100)} /> : <RecoverForm />}
    </div>
  );
}

import type { Metadata } from "next";
import { PasswordForm, ProfileForm } from "@/components/account/forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Mis datos" };

export default async function ProfilePage() {
  const user = (await getCurrentUser())!;
  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <section aria-labelledby="datos-personales">
        <h2 id="datos-personales" className="mb-4 text-xl">
          Datos personales
        </h2>
        <ProfileForm name={user.name} phone={user.phone ?? ""} email={user.email} />
      </section>
      <section aria-labelledby="cambiar-clave">
        <h2 id="cambiar-clave" className="mb-4 text-xl">
          Cambiar contraseña
        </h2>
        <PasswordForm />
      </section>
    </div>
  );
}

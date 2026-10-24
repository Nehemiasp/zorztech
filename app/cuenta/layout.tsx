import type { Metadata } from "next";
import { AccountNav } from "@/components/account/account-nav";
import { requireUser } from "@/lib/auth/guards";

export const metadata: Metadata = { title: { default: "Mi cuenta", template: "%s | Mi cuenta | ZorzTech" }, robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/cuenta");
  return (
    <div className="mx-auto max-w-page px-4 py-6 md:px-6 md:py-8">
      <h1 className="text-2xl md:text-3xl">Hola, {user.name.split(" ")[0]}</h1>
      <div className="mt-4">
        <AccountNav />
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

import type { Metadata } from "next";
import { AddressList } from "@/components/account/address-list";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Direcciones" };

export default async function AddressesPage() {
  const user = (await getCurrentUser())!;
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ esPredeterminada: "desc" }, { id: "asc" }] });
  return (
    <div>
      <h2 className="mb-4 text-xl">Mis direcciones</h2>
      <AddressList addresses={addresses.map((a) => ({ ...a, referencia: a.referencia ?? "" }))} />
    </div>
  );
}

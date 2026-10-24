import type { Metadata } from "next";
import { CouponForm } from "@/components/admin/coupon-form";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Nuevo cupón" };

export default async function NewCouponPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Nuevo cupón" />
      <CouponForm />
    </>
  );
}

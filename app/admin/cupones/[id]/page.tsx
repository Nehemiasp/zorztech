import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CouponForm, DeleteCouponForm, type CouponValues } from "@/components/admin/coupon-form";
import { PageHeader, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { centsToInput } from "@/lib/money";

export const metadata: Metadata = { title: "Editar cupón" };

// Las fechas del formulario son días de Guatemala (UTC-6).
const toDay = (d: Date | null) => (d ? new Date(d.getTime() - 6 * 3_600_000).toISOString().slice(0, 10) : "");

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const c = await db.coupon.findUnique({ where: { id: (await params).id } });
  if (!c) notFound();
  const values: CouponValues = {
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.type === "porcentaje" ? String(c.value) : centsToInput(c.value),
    minSubtotal: c.minSubtotal ? centsToInput(c.minSubtotal) : "",
    startsAt: toDay(c.startsAt),
    endsAt: toDay(c.endsAt),
    usageLimit: c.usageLimit ? String(c.usageLimit) : "",
    isActive: c.isActive,
  };
  return (
    <div className="space-y-10">
      <div>
        <PageHeader title={c.code} />
        <p className="mb-4 text-text-muted">Usado {c.usedCount} {c.usedCount === 1 ? "vez" : "veces"}.</p>
        <CouponForm coupon={values} />
      </div>
      <Panel title="Borrar cupón" className="max-w-xl">
        <DeleteCouponForm id={c.id} code={c.code} />
      </Panel>
    </div>
  );
}

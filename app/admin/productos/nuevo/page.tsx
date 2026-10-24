import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { emptyProduct } from "@/components/admin/product-state";
import { PageHeader } from "@/components/admin/ui";
import { getFormOptions } from "@/lib/admin/products";
import { requireAdmin } from "@/lib/auth/guards";
import { getStoreSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  await requireAdmin();
  const [{ categories, brands }, settings] = await Promise.all([getFormOptions(), getStoreSettings()]);
  const threshold = String(settings.inventory.lowStockDefault);
  return (
    <>
      <PageHeader title="Nuevo producto" />
      <ProductForm initial={emptyProduct("", threshold)} categories={categories} brands={brands} defaultThreshold={threshold} />
    </>
  );
}

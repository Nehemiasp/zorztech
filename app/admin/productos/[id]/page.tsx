import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import type { ProductState } from "@/components/admin/product-state";
import { PageHeader } from "@/components/admin/ui";
import { getAdminProduct, getFormOptions } from "@/lib/admin/products";
import { requireAdmin } from "@/lib/auth/guards";
import { getStoreSettings } from "@/lib/settings";
import { attributeLabel } from "@/lib/catalog/params";
import { centsToInput } from "@/lib/money";

export const metadata: Metadata = { title: "Editar producto" };

function pairs(value: unknown): { clave: string; valor: string }[] {
  return Array.isArray(value) ? value.flatMap((x) => (typeof x?.clave === "string" && typeof x?.valor === "string" ? [{ clave: x.clave, valor: x.valor }] : [])) : [];
}

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ creado?: string }> }) {
  await requireAdmin();
  const product = await getAdminProduct((await params).id);
  if (!product) notFound();
  const [{ categories, brands }, { creado }, settings] = await Promise.all([getFormOptions(), searchParams, getStoreSettings()]);

  const skuById = new Map(product.variants.map((v) => [v.id, v.sku]));
  const initial: ProductState = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brandId: product.brandId,
    newBrand: "",
    categoryId: product.categoryId,
    description: product.description,
    specs: pairs(product.specs),
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    isSample: product.isSample,
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      attributes: Object.entries((v.attributes ?? {}) as Record<string, unknown>).map(([clave, valor]) => ({ clave: attributeLabel(clave), valor: String(valor) })),
      price: centsToInput(v.price),
      compareAtPrice: v.compareAtPrice ? centsToInput(v.compareAtPrice) : "",
      stock: String(v.stock),
      lowStockThreshold: String(v.lowStockThreshold),
      isActive: v.isActive,
      reserved: v.reservedStock,
    })),
    images: product.images.map((i) => ({ url: i.url, alt: i.alt, variantSku: i.variantId ? (skuById.get(i.variantId) ?? null) : null })),
  };

  return (
    <>
      <PageHeader title={product.name} />
      <ProductForm initial={initial} categories={categories} brands={brands} created={creado === "1"} storefrontUrl={`/productos/${product.slug}`} defaultThreshold={String(settings.inventory.lowStockDefault)} />
    </>
  );
}

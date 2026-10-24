"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from "lucide-react";
import { Message } from "@/components/auth/forms";
import { CatalogImage } from "@/components/catalog-image";
import { buttonStyles } from "@/components/ui/button";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { saveProductAction, type ProductFormState } from "@/app/admin/productos/actions";
import { cn } from "@/lib/cn";
import { emptyVariant, type ImageState, type Pair, type ProductState, type VariantState } from "./product-state";

const move = <T,>(list: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= list.length) return list;
  const copy = [...list];
  copy.splice(to, 0, copy.splice(from, 1)[0]);
  return copy;
};

const iconButton = "inline-flex size-11 items-center justify-center rounded-md hover:bg-surface-light-alt disabled:opacity-40";

function PairsEditor({
  label,
  pairs,
  onChange,
  keyLabel,
  valueLabel,
  errors,
  prefix,
}: {
  label: string;
  pairs: Pair[];
  onChange: (pairs: Pair[]) => void;
  keyLabel: string;
  valueLabel: string;
  errors: Record<string, string>;
  prefix: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 font-medium">{label}</legend>
      <ul className="space-y-3">
        {pairs.map((pair, i) => (
          <li key={i} className="grid items-start gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <TextField label={keyLabel} value={pair.clave} onChange={(e) => onChange(pairs.map((p, j) => (j === i ? { ...p, clave: e.target.value } : p)))} error={errors[`${prefix}.${i}.clave`]} />
            <TextField label={valueLabel} value={pair.valor} onChange={(e) => onChange(pairs.map((p, j) => (j === i ? { ...p, valor: e.target.value } : p)))} error={errors[`${prefix}.${i}.valor`]} />
            <button type="button" onClick={() => onChange(pairs.filter((_, j) => j !== i))} className={cn(iconButton, "sm:mt-7")}>
              <Trash2 aria-hidden size={18} strokeWidth={1.75} />
              <span className="sr-only">Quitar {keyLabel.toLowerCase()} {i + 1}</span>
            </button>
          </li>
        ))}
      </ul>
      {errors[prefix] && <p className="mt-1 text-sm text-state-error">{errors[prefix]}</p>}
      <button type="button" onClick={() => onChange([...pairs, { clave: "", valor: "" }])} className="mt-2 inline-flex min-h-11 items-center gap-2 text-brand-primary-strong underline underline-offset-2">
        <Plus aria-hidden size={18} strokeWidth={1.75} />
        Agregar {keyLabel.toLowerCase()}
      </button>
    </fieldset>
  );
}

interface Props {
  initial: ProductState;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  created?: boolean;
  storefrontUrl?: string | null;
  /** Mínimo de stock que se propone en las variantes nuevas. */
  defaultThreshold?: string;
}

export function ProductForm({ initial, categories, brands, created, storefrontUrl, defaultThreshold = "3" }: Props) {
  const [product, setProduct] = useState<ProductState>(initial);
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProductAction, {});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const errors = state.fields ?? {};
  const set = <K extends keyof ProductState>(key: K, value: ProductState[K]) => setProduct((p) => ({ ...p, [key]: value }));
  const setVariant = (i: number, patch: Partial<VariantState>) => set("variants", product.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const setImage = (i: number, patch: Partial<ImageState>) => set("images", product.images.map((img, j) => (j === i ? { ...img, ...patch } : img)));

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    const added: ImageState[] = [];
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.set("archivo", file);
      try {
        const res = await fetch("/api/admin/imagenes", { method: "POST", body });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          setUploadError(`${file.name}: ${data.error ?? "no se pudo subir."}`);
          continue;
        }
        added.push({ url: data.url, alt: "", variantSku: null });
      } catch {
        setUploadError(`${file.name}: no pudimos conectar.`);
      }
    }
    setProduct((p) => ({ ...p, images: [...p.images, ...added] }));
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  const payload = JSON.stringify({
    id: product.id,
    name: product.name,
    slug: product.slug,
    brandId: product.newBrand ? null : product.brandId,
    newBrand: product.newBrand || undefined,
    categoryId: product.categoryId,
    description: product.description,
    specs: product.specs,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    isSample: product.isSample,
    variants: product.variants.map(({ reserved: _reserved, ...v }) => {
      void _reserved;
      return v;
    }),
    images: product.images,
  });

  return (
    <form action={action} noValidate className="space-y-8">
      {created && (
        <p role="status" className="rounded-md border border-state-success p-3 text-state-success">
          Creamos el producto. Ya puedes seguir completándolo.
        </p>
      )}
      <Message state={state} />
      <input type="hidden" name="payload" value={payload} />

      <section aria-labelledby="datos" className="space-y-4">
        <h2 id="datos" className="text-xl">Datos del producto</h2>
        <TextField label="Nombre" value={product.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <TextField
          label="Dirección en la tienda (opcional)"
          hint={product.slug ? `/productos/${product.slug}` : "Se crea sola a partir del nombre. Cambiarla después rompe los enlaces que ya compartiste."}
          value={product.slug}
          onChange={(e) => set("slug", e.target.value)}
          error={errors.slug}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Categoría"
            placeholder="Elige una categoría"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            value={product.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            error={errors.categoryId}
          />
          <SelectField
            label="Marca"
            placeholder="Sin marca"
            options={brands.map((b) => ({ value: b.id, label: b.name }))}
            value={product.brandId ?? ""}
            disabled={Boolean(product.newBrand)}
            onChange={(e) => set("brandId", e.target.value || null)}
          />
        </div>
        <TextField label="¿Marca nueva? Escríbela aquí" hint="Si la escribes, se crea y se usa en lugar de la lista." value={product.newBrand} onChange={(e) => set("newBrand", e.target.value)} error={errors.newBrand} />
        <TextAreaField label="Descripción" rows={6} value={product.description} onChange={(e) => set("description", e.target.value)} error={errors.description} />
      </section>

      <section aria-labelledby="especificaciones" className="space-y-3">
        <h2 id="especificaciones" className="text-xl">Especificaciones</h2>
        <PairsEditor label="Tabla de especificaciones técnicas" pairs={product.specs} onChange={(v) => set("specs", v)} keyLabel="Característica" valueLabel="Valor" errors={errors} prefix="specs" />
      </section>

      <section aria-labelledby="variantes" className="space-y-4">
        <h2 id="variantes" className="text-xl">Variantes, precios y stock</h2>
        {errors.variants && <p role="alert" className="text-state-error">{errors.variants}</p>}
        {product.variants.map((v, i) => (
          <fieldset key={v.id ?? `nueva-${i}`} className="space-y-4 rounded-lg border border-border p-4">
            <legend className="px-2 font-medium">Variante {i + 1}{v.name ? `: ${v.name}` : ""}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="SKU" value={v.sku} onChange={(e) => setVariant(i, { sku: e.target.value })} error={errors[`variants.${i}.sku`]} />
              <TextField label="Nombre de la variante" hint="Ejemplo: Negro, 128 GB." value={v.name} onChange={(e) => setVariant(i, { name: e.target.value })} error={errors[`variants.${i}.name`]} />
              <TextField label="Precio (Q)" inputMode="decimal" hint="Con IVA incluido." value={v.price} onChange={(e) => setVariant(i, { price: e.target.value })} error={errors[`variants.${i}.price`]} />
              <TextField label="Precio anterior (Q, opcional)" inputMode="decimal" hint="Si lo escribes, se muestra tachado y el ahorro." value={v.compareAtPrice} onChange={(e) => setVariant(i, { compareAtPrice: e.target.value })} error={errors[`variants.${i}.compareAtPrice`]} />
              <TextField label="Unidades en inventario" type="number" min={0} inputMode="numeric" hint={v.reserved ? `${v.reserved} apartadas en pedidos sin pagar.` : undefined} value={v.stock} onChange={(e) => setVariant(i, { stock: e.target.value })} error={errors[`variants.${i}.stock`]} />
              <TextField label="Avisar cuando queden" type="number" min={0} inputMode="numeric" hint="Unidades o menos: sale en el resumen y la ficha dice «Últimas unidades»." value={v.lowStockThreshold} onChange={(e) => setVariant(i, { lowStockThreshold: e.target.value })} error={errors[`variants.${i}.lowStockThreshold`]} />
            </div>
            <PairsEditor label="Atributos (para los filtros)" pairs={v.attributes} onChange={(a) => setVariant(i, { attributes: a })} keyLabel="Atributo" valueLabel="Valor" errors={errors} prefix={`variants.${i}.attributes`} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CheckboxField label="Disponible para la venta" checked={v.isActive} onChange={(e) => setVariant(i, { isActive: e.target.checked })} />
              {product.variants.length > 1 && (
                <button type="button" onClick={() => set("variants", product.variants.filter((_, j) => j !== i))} className="inline-flex min-h-11 items-center gap-2 text-state-error underline underline-offset-2">
                  <Trash2 aria-hidden size={18} strokeWidth={1.75} />
                  Quitar variante {i + 1}
                </button>
              )}
            </div>
          </fieldset>
        ))}
        <button type="button" onClick={() => set("variants", [...product.variants, emptyVariant(defaultThreshold)])} className={buttonStyles("secondary-light")}>
          <Plus aria-hidden size={18} strokeWidth={1.75} />
          Agregar variante
        </button>
      </section>

      <section aria-labelledby="imagenes" className="space-y-4">
        <h2 id="imagenes" className="text-xl">Imágenes</h2>
        <p className="text-text-muted">La primera es la que se ve en las tarjetas. Formato cuadrado (1:1), JPG, PNG, WebP o AVIF, hasta 5 MB.</p>
        {errors.images && <p role="alert" className="text-state-error">{errors.images}</p>}
        <ul className="space-y-3">
          {product.images.map((img, i) => (
            <li key={img.url + i} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[6rem_1fr_auto]">
              <div className="size-24 overflow-hidden rounded-md bg-surface-light-alt">
                <CatalogImage src={img.url} alt="" width={192} height={192} className="size-full object-cover" />
              </div>
              <div className="space-y-3">
                <TextField label="Descripción de la imagen" hint="Para quien no puede verla. Ejemplo: Audífonos negros vistos de frente." value={img.alt} onChange={(e) => setImage(i, { alt: e.target.value })} error={errors[`images.${i}.alt`]} />
                {product.variants.length > 1 && (
                  <SelectField
                    label="Se muestra con"
                    placeholder="Todas las variantes"
                    options={product.variants.filter((v) => v.sku).map((v) => ({ value: v.sku, label: `Solo ${v.name || v.sku}` }))}
                    value={img.variantSku ?? ""}
                    onChange={(e) => setImage(i, { variantSku: e.target.value || null })}
                  />
                )}
              </div>
              <div className="flex gap-1 sm:flex-col">
                <button type="button" disabled={i === 0} onClick={() => set("images", move(product.images, i, i - 1))} className={iconButton}>
                  <ArrowUp aria-hidden size={18} strokeWidth={1.75} />
                  <span className="sr-only">Subir imagen {i + 1}</span>
                </button>
                <button type="button" disabled={i === product.images.length - 1} onClick={() => set("images", move(product.images, i, i + 1))} className={iconButton}>
                  <ArrowDown aria-hidden size={18} strokeWidth={1.75} />
                  <span className="sr-only">Bajar imagen {i + 1}</span>
                </button>
                <button type="button" onClick={() => set("images", product.images.filter((_, j) => j !== i))} className={iconButton}>
                  <Trash2 aria-hidden size={18} strokeWidth={1.75} />
                  <span className="sr-only">Quitar imagen {i + 1}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div>
          <input ref={fileInput} id="subir-imagenes" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => upload(e.target.files)} />
          <label htmlFor="subir-imagenes" className={cn(buttonStyles("secondary-light"), "cursor-pointer", uploading && "pointer-events-none opacity-50")}>
            <Upload aria-hidden size={18} strokeWidth={1.75} />
            {uploading ? "Subiendo…" : "Subir imágenes"}
          </label>
          {uploadError && (
            <p role="alert" className="mt-2 text-state-error">
              {uploadError}
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="visibilidad" className="space-y-1">
        <h2 id="visibilidad" className="text-xl">Visibilidad</h2>
        <CheckboxField label="Producto activo" hint="Si lo desactivas, deja de verse en la tienda." checked={product.isActive} onChange={(e) => set("isActive", e.target.checked)} />
        <CheckboxField label="Destacado en el inicio" checked={product.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} />
        <CheckboxField label="Producto de ejemplo" hint="Se muestra con la etiqueta «Producto de ejemplo» y los buscadores no lo indexan. Desmárcalo cuando sea un producto real." checked={product.isSample} onChange={(e) => set("isSample", e.target.checked)} />
      </section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-border bg-surface-light px-4 py-3 md:-mx-0 md:px-0">
        <button type="submit" disabled={pending || uploading} className={buttonStyles("primary")}>
          {pending ? "Guardando…" : product.id ? "Guardar cambios" : "Crear producto"}
        </button>
        <Link href="/admin/productos" className={buttonStyles("secondary-light")}>
          Volver a productos
        </Link>
        {storefrontUrl && (
          <Link href={storefrontUrl} className="inline-flex min-h-11 items-center text-brand-primary-strong underline underline-offset-2" target="_blank">
            Ver en la tienda
          </Link>
        )}
      </div>
    </form>
  );
}

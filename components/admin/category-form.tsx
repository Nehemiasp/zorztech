"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { Message } from "@/components/auth/forms";
import { CatalogImage } from "@/components/catalog-image";
import { buttonStyles } from "@/components/ui/button";
import { CheckboxField, SelectField, TextField } from "@/components/ui/field";
import { deleteCategoryAction, saveCategoryAction } from "@/app/admin/categorias/actions";
import type { FormState } from "@/lib/auth/actions";

interface Props {
  category?: { id: string; name: string; slug: string; parentId: string | null; image: string | null; isActive: boolean };
  parents: { id: string; name: string }[];
}

export function CategoryForm({ category, parents }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCategoryAction, {});
  const [image, setImage] = useState(state.values?.image ?? category?.image ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const v = state.values;

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const body = new FormData();
    body.set("archivo", file);
    try {
      const res = await fetch("/api/admin/imagenes", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) setImage(data.url);
      else setUploadError(data.error ?? "No se pudo subir la imagen.");
    } catch {
      setUploadError("No pudimos conectar. Inténtalo de nuevo.");
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <form action={action} noValidate className="max-w-xl space-y-4">
      <Message state={state} />
      {category && <input type="hidden" name="id" value={category.id} />}
      <input type="hidden" name="image" value={image} />
      <TextField label="Nombre" name="name" defaultValue={v?.name ?? category?.name ?? ""} error={state.fields?.name} />
      <TextField label="Dirección en la tienda (opcional)" name="slug" hint="Se crea sola a partir del nombre." defaultValue={v?.slug ?? category?.slug ?? ""} error={state.fields?.slug} />
      <SelectField
        label="Categoría principal"
        name="parentId"
        placeholder="Ninguna (es una categoría principal)"
        options={parents.filter((p) => p.id !== category?.id).map((p) => ({ value: p.id, label: `Subcategoría de ${p.name}` }))}
        defaultValue={v?.parentId ?? category?.parentId ?? ""}
        error={state.fields?.parentId}
      />

      <div>
        <p className="mb-1 font-medium">Imagen (horizontal 4:3)</p>
        {image && (
          <div className="mb-2 aspect-[4/3] w-48 overflow-hidden rounded-md bg-surface-light-alt">
            <CatalogImage src={image} alt="" width={384} height={288} className="size-full object-cover" />
          </div>
        )}
        <input ref={fileInput} id="imagen-categoria" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="imagen-categoria" className={`${buttonStyles("secondary-light")} cursor-pointer`}>
            {uploading ? "Subiendo…" : image ? "Cambiar imagen" : "Subir imagen"}
          </label>
          {image && (
            <button type="button" onClick={() => setImage("")} className="inline-flex min-h-11 items-center text-state-error underline underline-offset-2">
              Quitar imagen
            </button>
          )}
        </div>
        {uploadError && (
          <p role="alert" className="mt-2 text-state-error">
            {uploadError}
          </p>
        )}
        {state.fields?.image && <p className="mt-1 text-sm text-state-error">{state.fields.image}</p>}
      </div>

      <CheckboxField label="Categoría activa" hint="Si la desactivas, deja de verse en la tienda junto con sus productos." name="isActive" defaultChecked={category?.isActive ?? true} />

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending || uploading} className={buttonStyles("primary")}>
          {pending ? "Guardando…" : category ? "Guardar cambios" : "Crear categoría"}
        </button>
        <Link href="/admin/categorias" className={buttonStyles("secondary-light")}>
          Volver a categorías
        </Link>
      </div>
    </form>
  );
}

export function DeleteCategoryForm({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteCategoryAction, {});
  return (
    <form action={action} className="space-y-3">
      <Message state={state} />
      <input type="hidden" name="id" value={id} />
      <p className="text-text-muted">Solo se puede borrar una categoría que no tenga productos ni subcategorías.</p>
      <button type="submit" disabled={pending} className={buttonStyles("secondary-light")}>
        Borrar «{name}»
      </button>
    </form>
  );
}

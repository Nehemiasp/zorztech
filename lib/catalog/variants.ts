import { attributeLabel } from "./params";

export interface VariantView {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  price: number;
  compareAtPrice: number | null;
  /** Unidades vendibles ahora (stock menos reservado). */
  available: number;
  lowStockThreshold: number;
}

export interface AttributeGroup {
  key: string;
  label: string;
  values: { value: string; available: boolean }[];
}

/** Clave que se usa cuando varias variantes no tienen atributos y solo se distinguen por su nombre. */
export const NAME_KEY = "opcion";

/** Variantes sin atributos pero con nombres distintos se eligen por nombre. */
export function withSelectableAttributes(variants: VariantView[]): VariantView[] {
  const hasAttributes = variants.some((v) => Object.keys(v.attributes).length > 0);
  if (hasAttributes || variants.length < 2) return variants;
  return variants.map((v) => ({ ...v, attributes: { [NAME_KEY]: v.name } }));
}

export function attributeGroups(variants: VariantView[]): AttributeGroup[] {
  const order: string[] = [];
  const values = new Map<string, Map<string, boolean>>();
  for (const v of variants) {
    for (const [key, value] of Object.entries(v.attributes)) {
      if (!values.has(key)) {
        values.set(key, new Map());
        order.push(key);
      }
      const group = values.get(key)!;
      group.set(value, (group.get(value) ?? false) || v.available > 0);
    }
  }
  return order.map((key) => ({
    key,
    label: key === NAME_KEY ? "Opción" : attributeLabel(key),
    values: [...values.get(key)!.entries()].map(([value, available]) => ({ value, available })),
  }));
}

/** Variante con la que abre la ficha: la pedida por SKU, si no la primera con unidades, si no la primera. */
export function initialVariant(variants: VariantView[], sku?: string | null): VariantView {
  return (
    variants.find((v) => v.sku === sku) ?? variants.find((v) => v.available > 0) ?? variants[0]
  );
}

/**
 * Al elegir un valor se busca la variante que lo tenga y coincida en más atributos con la elección
 * actual, prefiriendo las que se pueden comprar. Así nunca queda una combinación inexistente.
 */
export function selectAttribute(
  variants: VariantView[],
  current: VariantView,
  key: string,
  value: string,
): VariantView {
  const candidates = variants.filter((v) => v.attributes[key] === value);
  if (candidates.length === 0) return current;
  const score = (v: VariantView) =>
    Object.entries(current.attributes).filter(([k, val]) => k !== key && v.attributes[k] === val).length;
  return [...candidates].sort(
    (a, b) => score(b) - score(a) || Number(b.available > 0) - Number(a.available > 0),
  )[0];
}

export function variantSavings(v: Pick<VariantView, "price" | "compareAtPrice">): number {
  return v.compareAtPrice && v.compareAtPrice > v.price ? v.compareAtPrice - v.price : 0;
}

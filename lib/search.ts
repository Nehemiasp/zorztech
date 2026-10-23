/** Minúsculas, sin tildes ni signos y con espacios simples: "Audífonos  ANC" → "audifonos anc". */
export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s.]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Palabras de una búsqueda. Cada una debe aparecer en el producto. */
export function searchTokens(query: string, max = 6): string[] {
  const tokens = normalizeText(query).split(" ").filter(Boolean);
  return [...new Set(tokens)].slice(0, max);
}

interface SearchTextInput {
  name: string;
  brand?: string | null;
  categories: string[];
  description: string;
  variants: { name: string; sku: string }[];
}

/**
 * Texto en el que busca la tienda. Empieza por el nombre: así la posición de la frase completa
 * sirve para ordenar por relevancia (un nombre que la contiene va antes que una descripción).
 * Hay que recalcularlo cada vez que cambian el nombre, la marca, la categoría, la descripción o las variantes.
 */
export function buildSearchText(p: SearchTextInput): string {
  const raw = [p.name, p.brand ?? "", ...p.categories, ...p.variants.flatMap((v) => [v.name, v.sku]), p.description].join(" ");
  const text = normalizeText(raw);
  // Al final se agrega la versión sin guiones para que "wifi" encuentre "Wi-Fi" y "usbc" encuentre "USB-C".
  const joined = normalizeText(raw.replace(/(?<=[\p{L}\p{N}])-(?=[\p{L}\p{N}])/gu, ""));
  return joined === text ? text : `${text} ${joined}`;
}

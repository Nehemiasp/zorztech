import { z } from "zod";

export const PAGE_SIZE = 12;

export const sortOptions = [
  { value: "relevancia", label: "Relevancia" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
  { value: "nuevos", label: "Más nuevos" },
] as const;

export type SortValue = (typeof sortOptions)[number]["value"];

export interface ListingFilters {
  q: string;
  /** Subcategorías (o categorías, en la búsqueda) por slug. */
  categoria: string[];
  marca: string[];
  /** Precio en quetzales enteros, como se escribe en la URL. */
  desde: number | null;
  hasta: number | null;
  disponibles: boolean;
  /** Atributos de variante: { color: ["Negro"], capacidad: ["128 GB"] }. */
  atributos: Record<string, string[]>;
  orden: SortValue;
  pagina: number;
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

const ATTR_PREFIX = "a_";
const ATTR_KEY = /^[a-z0-9_-]{1,30}$/;

const text = (max: number) => z.string().trim().max(max);
const list = (max: number, items = 20) => z.array(text(max).min(1)).max(items);
const money = z.coerce.number().int().min(0).max(10_000_000);

function all(raw: RawSearchParams, key: string): string[] {
  const v = raw[key];
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

/** Lee los filtros de la URL. Los valores inválidos se descartan en lugar de romper la página. */
export function parseFilters(raw: RawSearchParams): ListingFilters {
  const atributos: Record<string, string[]> = {};
  for (const key of Object.keys(raw)) {
    if (!key.startsWith(ATTR_PREFIX)) continue;
    const name = key.slice(ATTR_PREFIX.length);
    if (!ATTR_KEY.test(name)) continue;
    const values = list(60, 10).safeParse(all(raw, key));
    if (values.success && values.data.length > 0) atributos[name] = values.data;
  }

  const first = (key: string) => all(raw, key)[0];
  const number = (key: string) => {
    // Un campo de precio vacío llega como "" y no debe contar como 0.
    const value = first(key)?.trim();
    if (!value) return null;
    const r = money.safeParse(value);
    return r.success ? r.data : null;
  };
  const sort = z.enum(sortOptions.map((o) => o.value) as [SortValue, ...SortValue[]]).safeParse(first("orden"));
  const page = z.coerce.number().int().min(1).max(500).safeParse(first("pagina"));

  let desde = number("desde");
  let hasta = number("hasta");
  if (desde !== null && hasta !== null && desde > hasta) [desde, hasta] = [hasta, desde];

  return {
    q: text(80).catch("").parse(first("q") ?? ""),
    categoria: list(80).catch([]).parse(all(raw, "categoria")),
    marca: list(80).catch([]).parse(all(raw, "marca")),
    desde,
    hasta,
    disponibles: first("disponibles") === "1",
    atributos,
    orden: sort.success ? sort.data : "relevancia",
    pagina: page.success ? page.data : 1,
  };
}

/** Query string de unos filtros, sin los valores por defecto. */
export function filtersToQuery(f: Partial<ListingFilters>): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  f.categoria?.forEach((v) => p.append("categoria", v));
  f.marca?.forEach((v) => p.append("marca", v));
  if (f.desde != null) p.set("desde", String(f.desde));
  if (f.hasta != null) p.set("hasta", String(f.hasta));
  if (f.disponibles) p.set("disponibles", "1");
  for (const [key, values] of Object.entries(f.atributos ?? {})) {
    values.forEach((v) => p.append(ATTR_PREFIX + key, v));
  }
  if (f.orden && f.orden !== "relevancia") p.set("orden", f.orden);
  if (f.pagina && f.pagina > 1) p.set("pagina", String(f.pagina));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function hasActiveFilters(f: ListingFilters): boolean {
  return (
    f.categoria.length > 0 ||
    f.marca.length > 0 ||
    f.desde !== null ||
    f.hasta !== null ||
    f.disponibles ||
    Object.keys(f.atributos).length > 0
  );
}

export const attributeParam = (key: string) => ATTR_PREFIX + key;

/** "capacidad" → "Capacidad" */
export function attributeLabel(key: string): string {
  const spaced = key.replace(/[-_]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

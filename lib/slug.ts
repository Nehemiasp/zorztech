/** "Audífonos inalámbricos ANC (negro)" → "audifonos-inalambricos-anc-negro" */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Primer slug libre a partir de uno base: "cable", "cable-2", "cable-3"… */
export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  const root = base || "producto";
  let candidate = root;
  for (let n = 2; await exists(candidate); n++) candidate = `${root}-${n}`;
  return candidate;
}

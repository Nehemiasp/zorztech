import { getNavCategories } from "@/lib/catalog/cards";
import { HeaderShell } from "./header-shell";

export async function SiteHeader() {
  const categories = await getNavCategories();
  return <HeaderShell categories={categories.map(({ name, slug }) => ({ name, slug }))} cartCount={0} />;
}

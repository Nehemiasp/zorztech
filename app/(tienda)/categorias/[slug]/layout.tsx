import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/catalog/listing";

// Ver app/productos/[slug]/layout.tsx: la comprobación va antes del estado de carga para devolver 404 real.
export default async function CategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!(await getCategoryBySlug(slug))) notFound();
  return children;
}

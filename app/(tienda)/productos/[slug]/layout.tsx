import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/catalog/product";

// La existencia se comprueba aquí, antes del estado de carga: así un producto inexistente responde 404 real
// y no un 200 con página de error. La consulta se comparte con la página (React cache).
export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!(await getProductBySlug(slug))) notFound();
  return children;
}

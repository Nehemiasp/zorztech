// Importa un catálogo desde un archivo JSON (por ejemplo, prisma/catalogo/catalogo-inicial.json).
// Crea o actualiza subcategorías, marcas, productos, variantes y fotos; se puede repetir sin duplicar nada.
//
//   npx tsx prisma/importar-catalogo.ts prisma/catalogo/catalogo-inicial.json --stock=5
//
// --stock fija las unidades de las variantes NUEVAS. Las que ya existen conservan su stock, salvo que se
// agregue --actualizar-stock. Las fotos de cada producto importado se reemplazan por las del archivo.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { buildSearchText } from "../lib/search";
import { slugify } from "../lib/slug";

interface Catalogo {
  subcategorias: { slug: string; name: string; parent: string }[];
  marcas: string[];
  productos: {
    slug: string;
    name: string;
    brand: string;
    category: string;
    description: string;
    specs: { clave: string; valor: string }[];
    featured?: boolean;
    variants: { sku: string; name: string; price: number; attributes: Record<string, string> }[];
    images: { url: string; alt: string; variantSku: string | null }[];
  }[];
}

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const stockArg = args.find((a) => a.startsWith("--stock="));
const updateStock = args.includes("--actualizar-stock");
if (!file || !stockArg) {
  console.error("Uso: npx tsx prisma/importar-catalogo.ts <archivo.json> --stock=<unidades> [--actualizar-stock]");
  process.exit(1);
}
const stock = Number(stockArg.split("=")[1]);
if (!Number.isInteger(stock) || stock < 0) {
  console.error("--stock debe ser un número entero de 0 o más.");
  process.exit(1);
}

const catalogo = JSON.parse(readFileSync(file, "utf8")) as Catalogo;
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  for (const [order, s] of catalogo.subcategorias.entries()) {
    const parent = await db.category.findUniqueOrThrow({ where: { slug: s.parent } });
    await db.category.upsert({
      where: { slug: s.slug },
      update: { name: s.name, parentId: parent.id },
      create: { slug: s.slug, name: s.name, parentId: parent.id, order },
    });
  }
  for (const name of catalogo.marcas) {
    await db.brand.upsert({ where: { slug: slugify(name) }, update: { name }, create: { slug: slugify(name), name } });
  }

  let nuevas = 0;
  for (const p of catalogo.productos) {
    const category = await db.category.findUniqueOrThrow({ where: { slug: p.category }, include: { parent: true } });
    const brand = await db.brand.findUniqueOrThrow({ where: { slug: slugify(p.brand) } });
    const data = {
      name: p.name,
      brandId: brand.id,
      categoryId: category.id,
      description: p.description,
      specs: p.specs,
      isFeatured: p.featured ?? false,
      isSample: false,
      isActive: true,
      searchText: buildSearchText({
        name: p.name,
        brand: brand.name,
        categories: [category.parent?.name, category.name].filter((n): n is string => Boolean(n)),
        description: p.description,
        variants: p.variants.map((v) => ({ name: v.name, sku: v.sku })),
      }),
    };
    const product = await db.product.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });

    const variantIds: Record<string, string> = {};
    for (const v of p.variants) {
      const existing = await db.productVariant.findUnique({ where: { sku: v.sku }, select: { id: true } });
      const base = { productId: product.id, name: v.name, attributes: v.attributes, price: v.price, isActive: true };
      const saved = existing
        ? await db.productVariant.update({ where: { sku: v.sku }, data: updateStock ? { ...base, stock } : base })
        : await db.productVariant.create({ data: { sku: v.sku, ...base, stock } });
      if (!existing) nuevas++;
      variantIds[v.sku] = saved.id;
    }

    await db.productImage.deleteMany({ where: { productId: product.id } });
    await db.productImage.createMany({
      data: p.images.map((img, order) => ({
        productId: product.id,
        variantId: img.variantSku ? variantIds[img.variantSku] : null,
        url: img.url,
        alt: img.alt,
        order,
      })),
    });
  }
  console.log(`Listo: ${catalogo.productos.length} productos, ${nuevas} variantes nuevas con ${stock} unidades cada una.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

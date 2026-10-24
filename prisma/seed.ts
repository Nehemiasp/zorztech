// Datos de ejemplo: 6 categorías con 6 subcategorías, 12 productos y 24 variantes.
// Nombres genéricos, sin marcas reales. Todo producto queda marcado como ejemplo (isSample)
// y los precios son inventados solo para probar la tienda: el dueño los reemplaza con su catálogo.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { hashPassword } from "../lib/auth/password";
import { departamentos } from "../lib/geo/departamentos";
import { buildSearchText } from "../lib/search";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const PRODUCT_IMAGES = [
  { url: "/img/placeholder/producto-1x1.svg", label: "vista frontal" },
  { url: "/img/placeholder/producto-lateral-1x1.svg", label: "vista lateral" },
  { url: "/img/placeholder/producto-detalle-1x1.svg", label: "detalle" },
];
const VARIANT_IMAGE = "/img/placeholder/producto-variante-1x1.svg";
const q = (quetzales: number) => quetzales * 100; // montos en centavos

const categories = [
  { slug: "celulares", name: "Celulares" },
  { slug: "laptops", name: "Laptops" },
  { slug: "audio", name: "Audio" },
  { slug: "accesorios", name: "Accesorios" },
  { slug: "gaming", name: "Gaming" },
  { slug: "hogar-inteligente", name: "Hogar inteligente" },
];

// Subcategorías (un solo nivel bajo una categoría principal).
const subcategories = [
  { slug: "audifonos", name: "Audífonos", parent: "audio" },
  { slug: "bocinas", name: "Bocinas", parent: "audio" },
  { slug: "cargadores", name: "Cargadores", parent: "accesorios" },
  { slug: "cables", name: "Cables", parent: "accesorios" },
  { slug: "controles", name: "Controles", parent: "gaming" },
  { slug: "teclados", name: "Teclados", parent: "gaming" },
];

const brands = [
  { slug: "marca-ejemplo-a", name: "Marca de ejemplo A" },
  { slug: "marca-ejemplo-b", name: "Marca de ejemplo B" },
];

interface SeedVariant {
  sku: string;
  name: string;
  attributes: Record<string, string>;
  price: number;
  compareAt?: number;
  stock: number;
  reserved?: number;
}

interface SeedProduct {
  slug: string;
  name: string;
  category: string;
  brand: string;
  featured?: boolean;
  description: string;
  specs: [string, string][];
  variants: SeedVariant[];
}

const products: SeedProduct[] = [
  {
    slug: "smartphone-65-5g",
    name: 'Smartphone 6.5" 5G',
    category: "celulares",
    brand: "marca-ejemplo-a",
    featured: true,
    description: "Producto de ejemplo. Smartphone de gama media con pantalla de 6.5 pulgadas y conectividad 5G.",
    specs: [["Pantalla", "6.5 pulgadas"], ["Conectividad", "5G"], ["Cámara principal", "50 MP"]],
    variants: [
      { sku: "EJ-CEL-001-128", name: "128 GB", attributes: { capacidad: "128 GB" }, price: q(2499), compareAt: q(2899), stock: 14 },
      { sku: "EJ-CEL-001-256", name: "256 GB", attributes: { capacidad: "256 GB" }, price: q(2899), stock: 9 },
    ],
  },
  {
    slug: "smartphone-basico-61",
    name: 'Smartphone básico 6.1"',
    category: "celulares",
    brand: "marca-ejemplo-b",
    description: "Producto de ejemplo. Smartphone de entrada para uso diario.",
    specs: [["Pantalla", "6.1 pulgadas"], ["Almacenamiento", "64 GB"], ["Batería", "4,500 mAh"]],
    variants: [
      { sku: "EJ-CEL-002-NEG", name: "Negro", attributes: { color: "Negro" }, price: q(899), stock: 30 },
      { sku: "EJ-CEL-002-AZU", name: "Azul", attributes: { color: "Azul" }, price: q(899), stock: 0 },
    ],
  },
  {
    slug: "laptop-156-uso-diario",
    name: 'Laptop 15.6" para uso diario',
    category: "laptops",
    brand: "marca-ejemplo-a",
    featured: true,
    description: "Producto de ejemplo. Laptop de 15.6 pulgadas para estudio y oficina.",
    specs: [["Pantalla", "15.6 pulgadas"], ["Almacenamiento", "SSD 512 GB"], ["Peso", "1.8 kg"]],
    variants: [
      { sku: "EJ-LAP-001-8", name: "8 GB de RAM", attributes: { memoria: "8 GB" }, price: q(3799), stock: 8 },
      { sku: "EJ-LAP-001-16", name: "16 GB de RAM", attributes: { memoria: "16 GB" }, price: q(4499), compareAt: q(4899), stock: 5 },
    ],
  },
  {
    slug: "laptop-ultraligera-14",
    name: 'Laptop ultraligera 14"',
    category: "laptops",
    brand: "marca-ejemplo-b",
    description: "Producto de ejemplo. Laptop delgada de 14 pulgadas para trabajar fuera de casa.",
    specs: [["Pantalla", "14 pulgadas"], ["Memoria", "16 GB"], ["Peso", "1.2 kg"]],
    variants: [
      { sku: "EJ-LAP-002-GRI", name: "Gris", attributes: { color: "Gris" }, price: q(6299), stock: 3, reserved: 1 },
      { sku: "EJ-LAP-002-PLA", name: "Plata", attributes: { color: "Plata" }, price: q(6299), stock: 6 },
    ],
  },
  {
    slug: "audifonos-inalambricos-anc",
    name: "Audífonos inalámbricos ANC",
    category: "audifonos",
    brand: "marca-ejemplo-a",
    featured: true,
    description: "Producto de ejemplo. Audífonos inalámbricos con cancelación activa de ruido.",
    specs: [["Cancelación de ruido", "Activa"], ["Autonomía", "30 horas"], ["Conexión", "Bluetooth"]],
    variants: [
      { sku: "EJ-AUD-001-NEG", name: "Negro", attributes: { color: "Negro" }, price: q(699), compareAt: q(849), stock: 22 },
      { sku: "EJ-AUD-001-BLA", name: "Blanco", attributes: { color: "Blanco" }, price: q(699), stock: 17 },
    ],
  },
  {
    slug: "bocina-bluetooth-portatil",
    name: "Bocina Bluetooth portátil",
    category: "bocinas",
    brand: "marca-ejemplo-b",
    featured: true,
    description: "Producto de ejemplo. Bocina portátil resistente al agua para exteriores.",
    specs: [["Autonomía", "12 horas"], ["Resistencia", "Al agua"], ["Conexión", "Bluetooth"]],
    variants: [
      { sku: "EJ-AUD-002-NEG", name: "Negro", attributes: { color: "Negro" }, price: q(349), stock: 40 },
      { sku: "EJ-AUD-002-AZU", name: "Azul", attributes: { color: "Azul" }, price: q(349), stock: 2 },
    ],
  },
  {
    slug: "cargador-usb-c-65w",
    name: "Cargador USB-C 65 W",
    category: "cargadores",
    brand: "marca-ejemplo-a",
    featured: true,
    description: "Producto de ejemplo. Cargador de carga rápida para laptop, tablet y celular.",
    specs: [["Potencia", "65 W"], ["Puertos", "2 × USB-C"]],
    variants: [
      { sku: "EJ-ACC-001-1P", name: "Con cable de 1 m", attributes: { cable: "1 m" }, price: q(229), stock: 50 },
      { sku: "EJ-ACC-001-2P", name: "Con cable de 2 m", attributes: { cable: "2 m" }, price: q(259), stock: 35 },
    ],
  },
  {
    slug: "cable-usb-c-trenzado",
    name: "Cable USB-C trenzado",
    category: "cables",
    brand: "marca-ejemplo-b",
    description: "Producto de ejemplo. Cable de carga y datos con cubierta trenzada.",
    specs: [["Conector", "USB-C a USB-C"], ["Carga", "Hasta 100 W"]],
    variants: [
      { sku: "EJ-ACC-002-1M", name: "1 m", attributes: { largo: "1 m" }, price: q(79), stock: 120 },
      { sku: "EJ-ACC-002-2M", name: "2 m", attributes: { largo: "2 m" }, price: q(99), stock: 80 },
    ],
  },
  {
    slug: "control-inalambrico",
    name: "Control inalámbrico",
    category: "controles",
    brand: "marca-ejemplo-a",
    featured: true,
    description: "Producto de ejemplo. Control inalámbrico compatible con PC y consolas.",
    specs: [["Conexión", "Inalámbrica 2.4 GHz y Bluetooth"], ["Autonomía", "20 horas"]],
    variants: [
      { sku: "EJ-GAM-001-NEG", name: "Negro", attributes: { color: "Negro" }, price: q(399), stock: 18 },
      { sku: "EJ-GAM-001-BLA", name: "Blanco", attributes: { color: "Blanco" }, price: q(399), compareAt: q(459), stock: 11 },
    ],
  },
  {
    slug: "teclado-mecanico-75",
    name: "Teclado mecánico 75 %",
    category: "teclados",
    brand: "marca-ejemplo-b",
    description: "Producto de ejemplo. Teclado compacto con interruptores mecánicos.",
    specs: [["Formato", "75 %"], ["Conexión", "USB-C y Bluetooth"], ["Iluminación", "Por tecla"]],
    variants: [
      { sku: "EJ-GAM-002-LIN", name: "Interruptor lineal", attributes: { interruptor: "Lineal" }, price: q(549), stock: 12 },
      { sku: "EJ-GAM-002-TAC", name: "Interruptor táctil", attributes: { interruptor: "Táctil" }, price: q(549), stock: 7 },
    ],
  },
  {
    slug: "foco-led-inteligente-wifi",
    name: "Foco LED inteligente Wi-Fi",
    category: "hogar-inteligente",
    brand: "marca-ejemplo-a",
    featured: true,
    description: "Producto de ejemplo. Foco regulable que se controla desde el celular.",
    specs: [["Conexión", "Wi-Fi 2.4 GHz"], ["Color", "Regulable, blanco cálido a frío"]],
    variants: [
      { sku: "EJ-HOG-001-1", name: "1 pieza", attributes: { paquete: "1 pieza" }, price: q(59), stock: 90 },
      { sku: "EJ-HOG-001-4", name: "Paquete de 4", attributes: { paquete: "4 piezas" }, price: q(199), compareAt: q(236), stock: 45 },
    ],
  },
  {
    slug: "camara-seguridad-wifi-interior",
    name: "Cámara de seguridad Wi-Fi interior",
    category: "hogar-inteligente",
    brand: "marca-ejemplo-b",
    featured: true,
    description: "Producto de ejemplo. Cámara fija para interiores con visión nocturna.",
    specs: [["Visión nocturna", "Sí"], ["Conexión", "Wi-Fi 2.4 GHz"], ["Audio", "Bidireccional"]],
    variants: [
      { sku: "EJ-HOG-002-1080", name: "1080p", attributes: { resolucion: "1080p" }, price: q(279), stock: 25 },
      { sku: "EJ-HOG-002-2K", name: "2K", attributes: { resolucion: "2K" }, price: q(369), stock: 14 },
    ],
  },
];

// Tarifas de ejemplo por departamento (centavos y días). El dueño las reemplaza desde el panel.
const sampleRates: Record<string, [number, number]> = {
  Guatemala: [q(35), 1],
  Sacatepéquez: [q(45), 2],
  Chimaltenango: [q(45), 2],
  Escuintla: [q(45), 2],
  "El Progreso": [q(55), 2],
  "Santa Rosa": [q(55), 2],
  Jalapa: [q(55), 3],
  Jutiapa: [q(55), 3],
  Zacapa: [q(60), 3],
  Chiquimula: [q(60), 3],
  Quetzaltenango: [q(60), 3],
  Retalhuleu: [q(60), 3],
  Suchitepéquez: [q(60), 3],
  Sololá: [q(60), 3],
  Totonicapán: [q(60), 3],
  "Baja Verapaz": [q(60), 3],
  "Alta Verapaz": [q(65), 4],
  Quiché: [q(65), 4],
  "San Marcos": [q(65), 4],
  Izabal: [q(75), 4],
  Huehuetenango: [q(75), 4],
  Petén: [q(85), 5],
};

async function seedStoreData() {
  for (const departamento of departamentos) {
    const [price, estimatedDays] = sampleRates[departamento];
    await db.shippingRate.upsert({
      where: { departamento },
      update: { price, estimatedDays },
      create: { departamento, price, estimatedDays },
    });
  }
  const existing = await db.pickupLocation.findFirst({ where: { name: "Tienda de ejemplo" } });
  if (!existing) {
    await db.pickupLocation.create({
      data: { name: "Tienda de ejemplo", address: "[Dirección de la tienda]", hours: "[Horario de atención]" },
    });
  }

  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    const passwordHash = await hashPassword(password);
    await db.user.upsert({
      where: { email },
      update: { role: "admin", passwordHash },
      create: { email, name: "Administrador", role: "admin", passwordHash },
    });
    console.log(`Administrador listo: ${email}`);
  }
}

async function main() {
  for (const [order, c] of categories.entries()) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, order, image: `/img/placeholder/categoria-${c.slug}-4x3.svg` },
      create: { ...c, order, image: `/img/placeholder/categoria-${c.slug}-4x3.svg` },
    });
  }
  for (const [order, c] of subcategories.entries()) {
    const parent = await db.category.findUniqueOrThrow({ where: { slug: c.parent } });
    await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, parentId: parent.id, order },
      create: { slug: c.slug, name: c.name, parentId: parent.id, order },
    });
  }
  for (const b of brands) {
    await db.brand.upsert({ where: { slug: b.slug }, update: { name: b.name }, create: b });
  }

  for (const p of products) {
    const category = await db.category.findUniqueOrThrow({ where: { slug: p.category } });
    const brand = await db.brand.findUniqueOrThrow({ where: { slug: p.brand } });
    const data = {
      name: p.name,
      brandId: brand.id,
      categoryId: category.id,
      description: p.description,
      specs: p.specs.map(([clave, valor]) => ({ clave, valor })),
      isFeatured: p.featured ?? false,
      isSample: true,
      isActive: true,
    };
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, ...data },
    });

    const variantIds: Record<string, string> = {};
    for (const v of p.variants) {
      const variantData = {
        productId: product.id,
        name: v.name,
        attributes: v.attributes,
        price: v.price,
        compareAtPrice: v.compareAt ?? null,
        stock: v.stock,
        reservedStock: v.reserved ?? 0,
      };
      const saved = await db.productVariant.upsert({
        where: { sku: v.sku },
        update: variantData,
        create: { sku: v.sku, ...variantData },
      });
      variantIds[v.sku] = saved.id;
    }

    await db.productImage.deleteMany({ where: { productId: product.id } });
    await db.productImage.createMany({
      data: PRODUCT_IMAGES.map((img, order) => ({
        productId: product.id,
        url: img.url,
        alt: `Imagen de ejemplo de ${p.name}, ${img.label}`,
        order,
      })),
    });
    // Un producto con foto propia por variante, para probar el cambio de galería.
    if (p.slug === "audifonos-inalambricos-anc") {
      await db.productImage.create({
        data: {
          productId: product.id,
          variantId: variantIds["EJ-AUD-001-BLA"],
          url: VARIANT_IMAGE,
          alt: `Imagen de ejemplo de ${p.name}, color blanco`,
          order: 0,
        },
      });
    }

    const parentName = category.parentId
      ? (await db.category.findUniqueOrThrow({ where: { id: category.parentId } })).name
      : null;
    await db.product.update({
      where: { id: product.id },
      data: {
        searchText: buildSearchText({
          name: p.name,
          brand: brand.name,
          categories: [parentName, category.name].filter((n): n is string => n !== null),
          description: p.description,
          variants: p.variants.map((v) => ({ name: v.name, sku: v.sku })),
        }),
      },
    });
  }

  await seedStoreData();

  const variantCount = await db.productVariant.count();
  console.log(`Seed listo: ${categories.length} categorías, ${products.length} productos, ${variantCount} variantes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

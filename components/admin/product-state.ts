// Estado del formulario de producto. Vive fuera del componente de cliente para poder usarlo también desde las páginas del servidor.

export interface Pair {
  clave: string;
  valor: string;
}
export interface VariantState {
  id?: string;
  sku: string;
  name: string;
  attributes: Pair[];
  price: string;
  compareAtPrice: string;
  stock: string;
  lowStockThreshold: string;
  isActive: boolean;
  /** Unidades apartadas en pedidos sin pagar (solo informativo). */
  reserved?: number;
}
export interface ImageState {
  url: string;
  alt: string;
  variantSku: string | null;
}
export interface ProductState {
  id?: string;
  name: string;
  slug: string;
  brandId: string | null;
  newBrand: string;
  categoryId: string;
  description: string;
  specs: Pair[];
  isActive: boolean;
  isFeatured: boolean;
  isSample: boolean;
  variants: VariantState[];
  images: ImageState[];
}

export const emptyVariant = (threshold = "3"): VariantState => ({ sku: "", name: "", attributes: [], price: "", compareAtPrice: "", stock: "0", lowStockThreshold: threshold, isActive: true });

export const emptyProduct = (categoryId = "", threshold = "3"): ProductState => ({
  name: "",
  slug: "",
  brandId: null,
  newBrand: "",
  categoryId,
  description: "",
  specs: [],
  isActive: true,
  isFeatured: false,
  isSample: false,
  variants: [emptyVariant(threshold)],
  images: [],
});


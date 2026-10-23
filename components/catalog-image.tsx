import Image from "next/image";

type Props = Omit<React.ComponentProps<typeof Image>, "src"> & { src: string };

/** Imagen del catálogo. Los placeholders SVG se sirven tal cual; las fotos reales pasan por el optimizador. */
export function CatalogImage({ src, alt, ...props }: Props) {
  return <Image src={src} alt={alt} unoptimized={src.endsWith(".svg")} {...props} />;
}

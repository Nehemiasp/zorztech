import Image from "next/image";

// Proporción del archivo: 1652 × 329. Marcador del logo definitivo en SVG (ver IMAGENES.md).
export function Logo({ height = 36, priority = false }: { height?: number; priority?: boolean }) {
  return (
    <Image
      src="/brand/zorztech-logo-oscuro.png"
      alt="ZorzTech"
      width={Math.round((height * 1652) / 329)}
      height={height}
      priority={priority}
      className="h-auto"
      style={{ height, width: "auto" }}
    />
  );
}

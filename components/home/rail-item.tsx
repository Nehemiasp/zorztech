const widths = {
  /** Dos y un poco por pantalla en celular, cinco en escritorio. */
  product: "w-[44%] sm:w-[30%] md:w-[calc((100%-3*1.5rem)/4)] lg:w-[calc((100%-4*1.5rem)/5)]",
  /** Tres y un poco en celular, ocho en escritorio. */
  category: "w-[29%] sm:w-[21%] md:w-[calc((100%-5*1.5rem)/6)] lg:w-[calc((100%-7*1.5rem)/8)]",
} as const;

/** Elemento de una fila del inicio. */
export function RailItem({ size = "product", children }: { size?: keyof typeof widths; children: React.ReactNode }) {
  return <li className={`flex shrink-0 snap-start flex-col [&>*]:flex-1 ${widths[size]}`}>{children}</li>;
}

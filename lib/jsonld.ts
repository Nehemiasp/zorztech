/** Serializa datos estructurados para un <script>. Escapa "<" para que ningún texto cierre la etiqueta. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

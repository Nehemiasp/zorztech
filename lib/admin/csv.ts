/** Una celda de CSV: se entrecomilla si hace falta y se neutraliza si Excel la leería como fórmula. */
export function csvCell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  // Una celda que empieza con = + - @ (o tabulación) se ejecuta como fórmula al abrirla en Excel.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV con BOM para que Excel respete los acentos y saltos de línea CRLF. */
export function toCsv(header: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [header, ...rows].map((row) => row.map(csvCell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** Centavos como "1299.00" (sin símbolo ni separador de miles: se abre bien en cualquier hoja de cálculo). */
export function centsToDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}

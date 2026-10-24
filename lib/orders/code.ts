import { randomInt } from "node:crypto";

// Sin 0, O, 1, I ni L: el cliente puede dictar el código por teléfono sin confundirse.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Código legible del pedido, por ejemplo ZT-4K7P2QXD. */
export function generateOrderCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `ZT-${code}`;
}

export function normalizeOrderCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

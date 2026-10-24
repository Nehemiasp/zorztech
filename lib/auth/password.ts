import bcrypt from "bcryptjs";

const COST = 12;

export const hashPassword = (password: string) => bcrypt.hash(password, COST);

// Hash de una contraseña inexistente: se compara igual cuando el correo no está registrado,
// para que el tiempo de respuesta no revele qué correos tienen cuenta.
const DUMMY_HASH = bcrypt.hashSync("contraseña-que-nadie-tiene", COST);

export async function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  const ok = await bcrypt.compare(password, hash ?? DUMMY_HASH);
  return Boolean(hash) && ok;
}

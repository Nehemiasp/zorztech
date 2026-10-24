import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta DATABASE_URL. Copia .env.example a .env y complétala.");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

function client(): PrismaClient {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

/**
 * Cliente de la base de datos. Se crea en la primera consulta, no al importar el módulo:
 * así el código que solo valida datos (esquemas, utilidades) se puede cargar y probar sin base de datos.
 */
export const db = new Proxy({} as PrismaClient, {
  get: (_target, property) => Reflect.get(client(), property),
});

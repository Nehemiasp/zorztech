import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` (postinstall) no se conecta; migrate y seed sí necesitan la variable.
    url: process.env.DATABASE_URL ?? "",
  },
});

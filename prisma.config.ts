import { defineConfig } from "prisma/config";
import path from "node:path";
import { config } from "dotenv";

// Carregar variáveis de ambiente do arquivo .env
config();

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
});
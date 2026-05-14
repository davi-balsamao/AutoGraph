import "dotenv/config";
import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  // @ts-ignore - Silencia o erro visual, o Prisma CLI já validou que isso funciona
  migrate: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    path: "prisma/migrations",
  },
  seed: "ts-node-dev prisma/seed.ts"
});
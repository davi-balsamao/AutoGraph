import "dotenv/config";
import { defineConfig } from "@prisma/config";

declare const process: any;

export default defineConfig({
  schema: "prisma/schema.prisma",
  
  // @ts-ignore
  migrate: {
    url: process.env.DATABASE_URL,
  },

  migrations: {
    path: "prisma/migrations",
    // ESSA É A LINHA QUE VOCÊ TENTOU RODAR NO TERMINAL:
    seed: "ts-node --transpile-only prisma/seed.ts" 
  },
});
import "dotenv/config";
import { defineConfig } from "@prisma/config"; 

export default defineConfig({
  schema: "prisma/schema.prisma",
  // @ts-ignore
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://user_grafica:password_segura@db:5432/printflow_db",
  },
  // @ts-ignore
  migrate: {
    url: process.env.DATABASE_URL || "postgresql://user_grafica:password_segura@db:5432/printflow_db",
  },
  migrations: {
    path: "prisma/migrations",
  },
  seed: "ts-node-dev prisma/seed.ts"
});
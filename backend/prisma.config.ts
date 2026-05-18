import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  
  // @ts-ignore
  datasource: {
    url: process.env.DATABASE_URL,
  },
  
  // @ts-ignore
  migrate: {
    url: process.env.DATABASE_URL,
  },

  migrations: {
    seed: 'ts-node --transpile-only prisma/seed.ts',
  },
});
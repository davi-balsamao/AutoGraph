"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("@prisma/config");
exports.default = (0, config_1.defineConfig)({
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

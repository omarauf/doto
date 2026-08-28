import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { env } from "@/config/env";

config({ path: [".env.local", ".env"] });

export default defineConfig({
  out: "./src/core/db/migrations",
  schema: "./src/core/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  casing: "snake_case",
});

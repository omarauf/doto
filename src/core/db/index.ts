import { drizzle } from "drizzle-orm/bun-sqlite";
import { env } from "@/config/env.ts";
import * as schema from "./schema.ts";

export const db = drizzle({
  connection: env.DATABASE_URL,
  schema,
  casing: "snake_case",
});

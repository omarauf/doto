import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { env } from "@/config/env";
import { db } from "../db";
import { todoList } from "../db/schema";
import * as schema from "./schema";

export const auth = betterAuth({
  appName: "Doto",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db.insert(todoList).values({
            id: crypto.randomUUID(),
            userId: user.id,
            name: "Inbox",
            color: "#E76F51",
          });
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
  plugins: [tanstackStartCookies()],
});

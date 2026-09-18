import { createServerFn } from "@tanstack/react-start";
import { asc, count, eq } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/core/auth/auth.server";
import { db } from "@/core/db";
import { todos } from "../todo/schema";
import { colors } from "./constant";
import { collections } from "./schema";
import { requireOwnedCollection } from "./service";

const idSchema = z.string().min(1).max(100);
const collectionNameSchema = z.string().trim().min(1).max(60);

export const getCollections = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();

  const data = await db
    .select({
      id: collections.id,
      name: collections.name,
      color: collections.color,
      position: collections.position,
      todoCount: count(todos.id),
    })
    .from(collections)
    .leftJoin(todos, eq(todos.collectionId, collections.id))
    .where(eq(collections.userId, user.id))
    .groupBy(collections.id)
    .orderBy(asc(collections.position), asc(collections.createdAt));

  return {
    user: { id: user.id, name: user.name, email: user.email },
    collections: data,
  };
});

export const createCollection = createServerFn({ method: "POST" })
  .validator(z.object({ name: collectionNameSchema, color: z.enum(colors) }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const [{ value: collectionCount }] = await db
      .select({ value: count() })
      .from(collections)
      .where(eq(collections.userId, user.id));

    const collection = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: data.name,
      color: data.color,
      position: collectionCount,
    };

    await db.insert(collections).values(collection);
    return collection;
  });

export const deleteCollection = createServerFn({ method: "POST" })
  .validator(z.object({ collectionId: idSchema }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await requireOwnedCollection(data.collectionId, user.id);
    await db.delete(collections).where(eq(collections.id, data.collectionId));
    return { deletedId: data.collectionId };
  });

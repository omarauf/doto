import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { and, asc, count, eq } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/core/auth/auth.server";
import { db } from "@/core/db";
import { collections, todos } from "./schema";

export const colors = ["#E76F51", "#2A9D8F", "#E9C46A", "#457B9D", "#8A5CF5", "#D65D7A"] as const;

const idSchema = z.string().min(1).max(100);
const collectionNameSchema = z.string().trim().min(1).max(60);
const todoNameSchema = z.string().trim().min(1).max(160);

async function requireOwnedCollection(collectionId: string, userId: string) {
  const owned = (
    await db
      .select({ id: collections.id })
      .from(collections)
      .where(and(eq(collections.id, collectionId), eq(collections.userId, userId)))
      .limit(1)
  ).at(0);

  if (!owned) {
    setResponseStatus(404);
    throw new Error("That collection could not be found.");
  }

  return owned;
}

export const getCollections = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();

  const data = await db
    .select({
      id: collections.id,
      name: collections.name,
      color: collections.color,
      position: collections.position,
    })
    .from(collections)
    .where(eq(collections.userId, user.id))
    .orderBy(asc(collections.position), asc(collections.createdAt));

  return {
    user: { id: user.id, name: user.name, email: user.email },
    collections: data,
  };
});

export const getTodos = createServerFn({ method: "GET" })
  .validator(z.object({ collectionId: z.string() }))
  .handler(async ({ data: { collectionId } }) => {
    const user = await requireUser();

    const data = await db
      .select({
        id: todos.id,
        collectionId: todos.collectionId,
        name: todos.name,
        completed: todos.completed,
        position: todos.position,
      })
      .from(todos)
      .innerJoin(collections, eq(todos.collectionId, collections.id))
      .where(and(eq(todos.collectionId, collectionId), eq(collections.userId, user.id)))
      .orderBy(asc(todos.position), asc(todos.createdAt));

    return {
      user: { id: user.id, name: user.name, email: user.email },
      todos: data,
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

export const createTodo = createServerFn({ method: "POST" })
  .validator(z.object({ collectionId: idSchema, name: todoNameSchema }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await requireOwnedCollection(data.collectionId, user.id);

    const [{ value: todoCount }] = await db
      .select({ value: count() })
      .from(todos)
      .where(eq(todos.collectionId, data.collectionId));

    const newTodo = {
      id: crypto.randomUUID(),
      collectionId: data.collectionId,
      name: data.name,
      completed: false,
      position: todoCount,
    };

    await db.insert(todos).values(newTodo);
    return newTodo;
  });

export const toggleTodo = createServerFn({ method: "POST" })
  .validator(
    z.object({
      todoId: idSchema,
      completed: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireUser();
    const ownedTodo = (
      await db
        .select({ id: todos.id })
        .from(todos)
        .innerJoin(collections, eq(todos.collectionId, collections.id))
        .where(and(eq(todos.id, data.todoId), eq(collections.userId, user.id)))
        .limit(1)
    ).at(0);

    if (!ownedTodo) {
      setResponseStatus(404);
      throw new Error("That to-do could not be found.");
    }

    await db.update(todos).set({ completed: data.completed }).where(eq(todos.id, data.todoId));

    return { id: data.todoId, completed: data.completed };
  });

export const deleteTodo = createServerFn({ method: "POST" })
  .validator(z.object({ todoId: idSchema }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const ownedTodo = (
      await db
        .select({ id: todos.id })
        .from(todos)
        .innerJoin(collections, eq(todos.collectionId, collections.id))
        .where(and(eq(todos.id, data.todoId), eq(collections.userId, user.id)))
        .limit(1)
    ).at(0);

    if (!ownedTodo) {
      setResponseStatus(404);
      throw new Error("That to-do could not be found.");
    }

    await db.delete(todos).where(eq(todos.id, data.todoId));
    return { deletedId: data.todoId };
  });

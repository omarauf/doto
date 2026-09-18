import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { and, asc, count, eq } from "drizzle-orm";
import { z } from "zod";
import { authMiddleware } from "@/core/auth/middleware";
import { db } from "@/core/db";
import { collections } from "../collection/schema";
import { requireOwnedCollection } from "../collection/service";
import { todos } from "./schema";

const idSchema = z.string().min(1).max(100);
const todoNameSchema = z.string().trim().min(1).max(160);

export const getTodos = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ collectionId: z.string() }))
  .handler(async ({ context, data: { collectionId } }) => {
    const { user } = context.session;

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

export const createTodo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ collectionId: idSchema, name: todoNameSchema }))
  .handler(async ({ context, data }) => {
    const { user } = context.session;
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
  .middleware([authMiddleware])
  .validator(
    z.object({
      todoId: idSchema,
      completed: z.boolean(),
    }),
  )
  .handler(async ({ context, data }) => {
    const { user } = context.session;
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
  .middleware([authMiddleware])
  .validator(z.object({ todoId: idSchema }))
  .handler(async ({ context, data }) => {
    const { user } = context.session;
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

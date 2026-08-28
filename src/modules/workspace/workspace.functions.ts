import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { and, asc, count, eq } from "drizzle-orm";
import { z } from "zod";
import { getRequestSession, requireUser } from "@/core/auth/auth.server";
import { db } from "@/core/db";
import { todo, todoList } from "../todo/schema";

export const listColors = [
  "#E76F51",
  "#2A9D8F",
  "#E9C46A",
  "#457B9D",
  "#8A5CF5",
  "#D65D7A",
] as const;

const idSchema = z.string().min(1).max(100);
const listNameSchema = z.string().trim().min(1).max(60);
const todoNameSchema = z.string().trim().min(1).max(160);

async function requireOwnedList(listId: string, userId: string) {
  const ownedList = (
    await db
      .select({ id: todoList.id })
      .from(todoList)
      .where(and(eq(todoList.id, listId), eq(todoList.userId, userId)))
      .limit(1)
  ).at(0);

  if (!ownedList) {
    setResponseStatus(404);
    throw new Error("That list could not be found.");
  }

  return ownedList;
}

export const getSession = createServerFn({ method: "GET" }).handler(() => getRequestSession());

export const getWorkspace = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();

  const [lists, todos] = await Promise.all([
    db
      .select({
        id: todoList.id,
        name: todoList.name,
        color: todoList.color,
        position: todoList.position,
      })
      .from(todoList)
      .where(eq(todoList.userId, user.id))
      .orderBy(asc(todoList.position), asc(todoList.createdAt)),
    db
      .select({
        id: todo.id,
        listId: todo.listId,
        name: todo.name,
        completed: todo.completed,
        position: todo.position,
      })
      .from(todo)
      .innerJoin(todoList, eq(todo.listId, todoList.id))
      .where(eq(todoList.userId, user.id))
      .orderBy(asc(todo.position), asc(todo.createdAt)),
  ]);

  return {
    user: { id: user.id, name: user.name, email: user.email },
    lists,
    todos,
  };
});

export const createList = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: listNameSchema,
      color: z.enum(listColors),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireUser();
    const [{ value: listCount }] = await db
      .select({ value: count() })
      .from(todoList)
      .where(eq(todoList.userId, user.id));

    const newList = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: data.name,
      color: data.color,
      position: listCount,
    };

    await db.insert(todoList).values(newList);
    return newList;
  });

export const deleteList = createServerFn({ method: "POST" })
  .validator(z.object({ listId: idSchema }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await requireOwnedList(data.listId, user.id);
    await db.delete(todoList).where(eq(todoList.id, data.listId));
    return { deletedId: data.listId };
  });

export const createTodo = createServerFn({ method: "POST" })
  .validator(
    z.object({
      listId: idSchema,
      name: todoNameSchema,
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireUser();
    await requireOwnedList(data.listId, user.id);

    const [{ value: todoCount }] = await db
      .select({ value: count() })
      .from(todo)
      .where(eq(todo.listId, data.listId));

    const newTodo = {
      id: crypto.randomUUID(),
      listId: data.listId,
      name: data.name,
      completed: false,
      position: todoCount,
    };

    await db.insert(todo).values(newTodo);
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
        .select({ id: todo.id })
        .from(todo)
        .innerJoin(todoList, eq(todo.listId, todoList.id))
        .where(and(eq(todo.id, data.todoId), eq(todoList.userId, user.id)))
        .limit(1)
    ).at(0);

    if (!ownedTodo) {
      setResponseStatus(404);
      throw new Error("That to-do could not be found.");
    }

    await db.update(todo).set({ completed: data.completed }).where(eq(todo.id, data.todoId));

    return { id: data.todoId, completed: data.completed };
  });

export const deleteTodo = createServerFn({ method: "POST" })
  .validator(z.object({ todoId: idSchema }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const ownedTodo = (
      await db
        .select({ id: todo.id })
        .from(todo)
        .innerJoin(todoList, eq(todo.listId, todoList.id))
        .where(and(eq(todo.id, data.todoId), eq(todoList.userId, user.id)))
        .limit(1)
    ).at(0);

    if (!ownedTodo) {
      setResponseStatus(404);
      throw new Error("That to-do could not be found.");
    }

    await db.delete(todo).where(eq(todo.id, data.todoId));
    return { deletedId: data.todoId };
  });

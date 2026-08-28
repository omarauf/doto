import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "@/core/auth/schema";

export const todoList = sqliteTable(
  "todo_list",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text().notNull(),
    color: text().notNull(),
    position: integer().default(0).notNull(),
    createdAt: integer({ mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer({ mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("todo_list_user_id_idx").on(table.userId)],
);

export const todo = sqliteTable(
  "todo",
  {
    id: text().primaryKey(),
    listId: text()
      .notNull()
      .references(() => todoList.id, { onDelete: "cascade" }),
    name: text().notNull(),
    completed: integer({ mode: "boolean" }).default(false).notNull(),
    position: integer().default(0).notNull(),
    createdAt: integer({ mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer({ mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("todo_list_id_idx").on(table.listId)],
);

export const todoListRelations = relations(todoList, ({ one, many }) => ({
  user: one(users, {
    fields: [todoList.userId],
    references: [users.id],
  }),
  todos: many(todo),
}));

export const todoRelations = relations(todo, ({ one }) => ({
  list: one(todoList, {
    fields: [todo.listId],
    references: [todoList.id],
  }),
}));

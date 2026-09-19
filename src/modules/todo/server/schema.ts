import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { collections } from "../../collection/server/schema";

export const todos = sqliteTable(
  "todos",
  {
    id: text().primaryKey(),
    collectionId: text()
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
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
  (table) => [index("todos_collection_id_idx").on(table.collectionId)],
);

export const todosRelations = relations(todos, ({ one }) => ({
  list: one(collections, {
    fields: [todos.collectionId],
    references: [collections.id],
  }),
}));

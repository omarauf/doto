import { setResponseStatus } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/core/db";
import { collections } from "./schema";

export async function requireOwnedCollection(collectionId: string, userId: string) {
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

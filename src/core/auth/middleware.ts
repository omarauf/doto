import { createMiddleware } from "@tanstack/react-start";
import { auth } from "./lib.server";

export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    throw new Error("Unauthorized");
  }

  return await next({ context: { session } });
});

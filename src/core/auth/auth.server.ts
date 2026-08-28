import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders, setResponseStatus } from "@tanstack/react-start/server";
import { auth } from "./lib";

export const getSession = createServerFn({ method: "GET" }).handler(() => getRequestSession());

export async function getRequestSession() {
  return auth.api.getSession({ headers: getRequestHeaders() });
}

export async function requireUser() {
  const session = await getRequestSession();

  if (!session) {
    setResponseStatus(401);
    throw new Error("Please sign in to continue.");
  }

  return session.user;
}

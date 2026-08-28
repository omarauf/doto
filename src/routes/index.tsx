import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { getSession } from "@/core/auth/auth.server";

export const Route = createFileRoute("/")({
  validateSearch: z.object({
    collectionId: z.string().min(1).max(100).optional().catch(undefined),
  }),
  beforeLoad: async () => {
    const session = await getSession();

    if (!session) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: Page,
});

function Page() {
  const { collectionId } = Route.useSearch();

  return <p>Collection Id: {collectionId}</p>;
}

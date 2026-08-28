import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { getSession } from "@/core/auth/auth.server";

export const Route = createFileRoute("/")({
  validateSearch: z.object({
    list: z.string().min(1).max(100).optional().catch(undefined),
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
  const { list } = Route.useSearch();

  return <p>Workspace: {list}</p>;
}

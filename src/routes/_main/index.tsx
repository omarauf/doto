import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "@/core/auth/auth.functions";

export const Route = createFileRoute("/_main/")({
  component: Page,
  beforeLoad: async () => {
    const session = await getSession();

    if (!session) {
      throw redirect({ to: "/sign-in" });
    }
  },
});

function Page() {
  return <p>index page</p>;
}

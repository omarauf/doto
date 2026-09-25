import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "@/core/auth/auth.functions";
import { MainLayout } from "@/modules/collection/components/main-layout";
import { collectionsQueries } from "@/modules/collection/server/queries";

export const Route = createFileRoute("/_main")({
  beforeLoad: async ({ context }) => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: "/sign-in" });
    }
    // Prefetch collections so the sidebar renders instantly (SSR-streamed).
    await context.queryClient.ensureQueryData(collectionsQueries.list()).catch(() => undefined);
    return { session };
  },
  component: MainLayout,
});

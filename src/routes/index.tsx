import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { getSession } from "@/core/auth/auth.server";
import { CollectionSidebar } from "@/modules/collection/components/collection-sidebar";
import { collectionsQueries } from "@/modules/collection/queries";
import { TodoList } from "@/modules/todo/components/todo-list";
import { todosQueries } from "@/modules/todo/queries";

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
  loaderDeps: ({ search: { collectionId } }) => ({ collectionId }),
  loader: async ({ context, deps }) => {
    const data = await context.queryClient.ensureQueryData(collectionsQueries.list());
    const target = deps.collectionId ?? data.collections[0]?.id;

    if (target) {
      await context.queryClient.ensureQueryData(todosQueries.list(target));
    }
  },
  pendingComponent: () => (
    <div className="grid h-dvh place-items-center text-muted-foreground text-sm">Loading</div>
  ),
  component: Page,
});

function Page() {
  const { collectionId } = Route.useSearch();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(collectionsQueries.list());

  const selectedCollection =
    data.collections.find((collection) => collection.id === collectionId) ?? data.collections[0];

  return (
    <div className="flex h-dvh min-h-0 flex-col md:flex-row">
      <CollectionSidebar
        user={data.user}
        collections={data.collections}
        selectedId={selectedCollection?.id}
        onSelect={(id) => navigate({ to: "/", search: { collectionId: id } })}
      />
      {selectedCollection ? (
        <TodoList key={selectedCollection.id} collection={selectedCollection} />
      ) : (
        <main className="grid min-h-0 flex-1 place-items-center">
          <p className="text-muted-foreground text-sm">Create a collection to get started</p>
        </main>
      )}
    </div>
  );
}

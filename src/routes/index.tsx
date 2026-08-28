import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { z } from "zod"

import { Workspace } from "@/features/workspace/workspace"
import { getSession } from "@/features/workspace/workspace.functions"
import { workspaceQuery } from "@/features/workspace/workspace.queries"

const workspaceSearchSchema = z.object({
  list: z.string().min(1).max(100).optional().catch(undefined),
})

export const Route = createFileRoute("/")({
  validateSearch: (search) => workspaceSearchSchema.parse(search),
  beforeLoad: async ({ location }) => {
    const session = await getSession()

    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      })
    }
  },
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(workspaceQuery()),
  component: WorkspacePage,
})

function WorkspacePage() {
  const { data } = useSuspenseQuery(workspaceQuery())
  const { list } = Route.useSearch()

  return <Workspace data={data} selectedListId={list} />
}

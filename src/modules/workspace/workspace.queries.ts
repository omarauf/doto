import { queryOptions } from "@tanstack/react-query";

import { getWorkspace } from "./workspace.functions";

export const workspaceKeys = {
  all: ["workspace"] as const,
  detail: () => [...workspaceKeys.all, "detail"] as const,
};

export const workspaceQuery = () =>
  queryOptions({
    queryKey: workspaceKeys.detail(),
    queryFn: () => getWorkspace(),
    staleTime: 30_000,
  });

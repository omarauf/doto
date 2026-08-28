import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { createTodo, getTodos } from "./functions";

export const todosQueries = {
  all: ["todos"],
  list: (collectionId: string) =>
    queryOptions({
      queryKey: [...todosQueries.all, "list"],
      queryFn: () => getTodos({ data: { collectionId } }),
      staleTime: 30_000,
    }),

  create: () =>
    mutationOptions({
      mutationKey: [...todosQueries.all, "create"],
      mutationFn: (data: { collectionId: string; name: string }) => createTodo({ data }),
    }),
};

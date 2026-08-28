import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { createTodo, getCollections, getTodos } from "./functions";

export const collectionsQueries = {
  all: ["collections"],
  list: () =>
    queryOptions({
      queryKey: [...collectionsQueries.all, "list"],
      queryFn: () => getCollections(),
      staleTime: 30_000,
    }),

  create: () =>
    mutationOptions({
      mutationKey: [...collectionsQueries.all, "create"],
    }),
};

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

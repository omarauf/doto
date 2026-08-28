import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { getCollections } from "./functions";

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

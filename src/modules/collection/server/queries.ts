import { mutationOptions, queryOptions } from "@tanstack/react-query";

import type { colors } from "../constant";
import { createCollection, deleteCollection, getCollections } from "./functions";

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
      mutationFn: (data: { name: string; color: (typeof colors)[number] }) =>
        createCollection({ data }),
    }),

  delete: () =>
    mutationOptions({
      mutationKey: [...collectionsQueries.all, "delete"],
      mutationFn: (data: { collectionId: string }) => deleteCollection({ data }),
    }),
};

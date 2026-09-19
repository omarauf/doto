import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { createTodo, deleteTodo, getTodos, toggleTodo } from "./functions";

export const todosQueries = {
  all: ["todos"],
  list: (collectionId: string) =>
    queryOptions({
      queryKey: [...todosQueries.all, "list", collectionId],
      queryFn: () => getTodos({ data: { collectionId } }),
      staleTime: 30_000,
    }),

  create: () =>
    mutationOptions({
      mutationKey: [...todosQueries.all, "create"],
      mutationFn: (data: { collectionId: string; name: string }) => createTodo({ data }),
    }),

  toggle: () =>
    mutationOptions({
      mutationKey: [...todosQueries.all, "toggle"],
      mutationFn: (data: { todoId: string; completed: boolean }) => toggleTodo({ data }),
    }),

  delete: () =>
    mutationOptions({
      mutationKey: [...todosQueries.all, "delete"],
      mutationFn: (data: { todoId: string }) => deleteTodo({ data }),
    }),
};

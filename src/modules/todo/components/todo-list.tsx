import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { CheckIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { getError } from "@/lib/error";
import { cn } from "@/lib/utils";
import { collectionsQueries } from "@/modules/collection/queries";
import { todosQueries } from "../queries";

interface TodoListProps {
  collection: { id: string; name: string; color: string };
}

export function TodoList({ collection }: TodoListProps) {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(todosQueries.list(collection.id));
  const [draft, setDraft] = useState("");
  const listKey = todosQueries.list(collection.id).queryKey;

  const createTodoMutation = useMutation({
    ...todosQueries.create(),
    onSuccess: async () => {
      setDraft("");
      await queryClient.invalidateQueries({ queryKey: todosQueries.all });
      await queryClient.invalidateQueries({ queryKey: collectionsQueries.all });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        description: getError(error, "We could not add that to-do."),
        priority: "high",
      });
    },
  });

  const toggleTodoMutation = useMutation({
    ...todosQueries.toggle(),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData(listKey);
      queryClient.setQueryData(listKey, (current) =>
        current
          ? {
              ...current,
              todos: current.todos.map((todo) =>
                todo.id === input.todoId ? { ...todo, completed: input.completed } : todo,
              ),
            }
          : current,
      );
      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous);
      }
      toast.add({
        type: "error",
        description: getError(error, "We could not update that to-do."),
        priority: "high",
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: todosQueries.all }),
  });

  const deleteTodoMutation = useMutation({
    ...todosQueries.delete(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: collectionsQueries.all });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        description: getError(error, "We could not delete that to-do."),
        priority: "high",
      });
    },
  });

  const completedCount = data.todos.filter((todo) => todo.completed).length;

  const submitDraft = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    createTodoMutation.mutate({ collectionId: collection.id, name: trimmed });
  };

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex items-end justify-between px-6 pt-7 pb-5 md:px-10 md:pt-9">
        <div>
          <h1 className="font-semibold font-serif text-3xl tracking-tight">{collection.name}</h1>
          <span
            aria-hidden="true"
            className="mt-2.5 block h-1 w-8 rounded-full"
            style={{ backgroundColor: collection.color }}
          />
        </div>
        {data.todos.length > 0 && (
          <ProgressRing
            completed={completedCount}
            total={data.todos.length}
            color={collection.color}
          />
        )}
      </header>

      <ul className="min-h-0 flex-1 overflow-y-auto px-6 md:px-10">
        {data.todos.map((todo) => (
          <li
            key={todo.id}
            className="group relative flex items-center border-border/40 border-b last:border-b-0"
            style={{ "--c": collection.color } as React.CSSProperties}
          >
            <button
              type="button"
              onClick={() =>
                toggleTodoMutation.mutate({ todoId: todo.id, completed: !todo.completed })
              }
              className="flex h-[52px] min-w-0 flex-1 items-center gap-3.5 rounded-lg px-1.5 pr-10 text-left text-[15px] transition-colors hover:bg-accent/30"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] transition-colors",
                  todo.completed
                    ? "text-background"
                    : "border-muted-foreground/40 text-transparent group-hover:border-(--c)",
                )}
                style={
                  todo.completed
                    ? { backgroundColor: collection.color, borderColor: collection.color }
                    : undefined
                }
              >
                <CheckIcon className="size-2.5" strokeWidth={3.5} />
              </span>
              <span
                className={cn(
                  "truncate",
                  todo.completed && "text-muted-foreground line-through decoration-[1px]",
                )}
              >
                {todo.name}
              </span>
            </button>
            <button
              type="button"
              aria-label={`Delete ${todo.name}`}
              onClick={() => deleteTodoMutation.mutate({ todoId: todo.id })}
              className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
            >
              <Trash2Icon className="size-4" />
            </button>
          </li>
        ))}
        {data.todos.length === 0 && (
          <li className="grid place-items-center py-16 text-muted-foreground text-sm">
            No to-dos yet
          </li>
        )}
      </ul>

      <form
        onSubmit={submitDraft}
        className="flex items-center gap-3.5 border-border/40 border-t px-6 py-4 md:px-10"
      >
        <span
          aria-hidden="true"
          className="grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] border-muted-foreground/40 text-muted-foreground"
        >
          <PlusIcon className="size-3" />
        </span>
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a to-do"
          aria-label={`Add a to-do to ${collection.name}`}
          className="h-auto flex-1 rounded-none border-0 bg-transparent px-0 text-[15px] shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      </form>
    </main>
  );
}

function ProgressRing({
  completed,
  total,
  color,
}: {
  completed: number;
  total: number;
  color: string;
}) {
  const percent = Math.round((completed / total) * 100);
  return (
    <div className="relative size-11 shrink-0">
      <svg viewBox="0 0 44 44" className="size-11 -rotate-90" aria-hidden="true">
        <circle cx="22" cy="22" r="19" fill="none" strokeWidth="3" className="stroke-border" />
        <circle
          cx="22"
          cy="22"
          r="19"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${percent} 100`}
          style={{ stroke: color }}
        />
      </svg>
      <span
        className="absolute inset-0 grid place-items-center text-[10px] text-muted-foreground tabular-nums"
        aria-label={`${completed} of ${total} completed`}
      >
        {completed}/{total}
      </span>
    </div>
  );
}

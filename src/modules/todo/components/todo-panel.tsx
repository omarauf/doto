import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { CheckCheck, ListTodo, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { useAppForm } from "@/components/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { getError } from "@/lib/error";
import { cn } from "@/lib/utils";
import { useCollectionSelection } from "@/modules/collection/components/collection-selection-context";
import { collectionsQueries } from "@/modules/collection/server/queries";
import { todosQueries } from "@/modules/todo/server/queries";

function useSelectedCollection() {
  const { selectedId, select } = useCollectionSelection();
  const collectionsQuery = useSuspenseQuery(collectionsQueries.list());
  const collections = collectionsQuery.data.collections;

  const selected = collections.find((c) => c.id === selectedId) ?? collections[0] ?? null;

  return { selected, collections, select, selectedId };
}

function AddTodoForm({ collectionId }: { collectionId: string }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");

  const createMutation = useMutation({
    ...todosQueries.create(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...todosQueries.all, "list", collectionId],
      });
      await queryClient.invalidateQueries({ queryKey: collectionsQueries.all });
    },
    onError: (error) => {
      toast.add({ type: "error", description: getError(error, "Could not add todo.") });
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = value.trim();
    if (!name) return;
    createMutation.mutate({ collectionId, name });
    setValue("");
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a task…"
        maxLength={160}
        aria-label="New todo name"
      />
      <Button type="submit" disabled={!value.trim() || createMutation.isPending}>
        <Plus /> Add
      </Button>
    </form>
  );
}

function TodoRow({
  todo,
  collectionId,
}: {
  todo: { id: string; name: string; completed: boolean };
  collectionId: string;
}) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    ...todosQueries.toggle(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...todosQueries.all, "list", collectionId],
      });
      await queryClient.invalidateQueries({ queryKey: collectionsQueries.all });
    },
    onError: (error) => {
      toast.add({ type: "error", description: getError(error, "Could not update todo.") });
    },
  });

  const deleteMutation = useMutation({
    ...todosQueries.delete(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...todosQueries.all, "list", collectionId],
      });
      await queryClient.invalidateQueries({ queryKey: collectionsQueries.all });
    },
    onError: (error) => {
      toast.add({ type: "error", description: getError(error, "Could not delete todo.") });
    },
  });

  return (
    <li
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-transparent bg-card px-3 py-2.5 shadow-xs ring-1 ring-foreground/5 transition-colors hover:border-border",
        todo.completed && "opacity-70",
      )}
    >
      <Checkbox
        checked={todo.completed}
        onCheckedChange={(checked) =>
          toggleMutation.mutate({ todoId: todo.id, completed: checked === true })
        }
        aria-label={
          todo.completed ? `Mark “${todo.name}” as not done` : `Mark “${todo.name}” as done`
        }
      />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          todo.completed && "text-muted-foreground line-through",
        )}
        title={todo.name}
      >
        {todo.name}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        className="opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
        onClick={() => deleteMutation.mutate({ todoId: todo.id })}
        title={`Delete “${todo.name}”`}
      >
        <Trash2 />
        <span className="sr-only">Delete {todo.name}</span>
      </Button>
    </li>
  );
}

function TodoList({ collectionId }: { collectionId: string }) {
  const todosQuery = useSuspenseQuery(todosQueries.list(collectionId));
  const todos = todosQuery.data.todos;
  const done = todos.filter((t) => t.completed).length;

  if (todos.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-muted">
            <ListTodo className="size-5 text-muted-foreground" />
          </span>
          <p className="font-medium text-sm">No tasks yet</p>
          <p className="text-muted-foreground text-sm">Add your first task above to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <CheckCheck className="size-3.5" />
        {done} of {todos.length} done
      </div>
      <ul className="space-y-2">
        {todos.map((todo) => (
          <TodoRow key={todo.id} todo={todo} collectionId={collectionId} />
        ))}
      </ul>
    </div>
  );
}

function TodoListFallback() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function TodoPanel() {
  const { selected } = useSelectedCollection();

  if (!selected) {
    return (
      <SidebarInset className="flex min-h-svh flex-col">
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <h1 className="font-heading font-semibold text-sm">Doto</h1>
        </header>
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted">
            <ListTodo className="size-6 text-muted-foreground" />
          </span>
          <p className="font-medium">No collection selected</p>
          <p className="max-w-sm text-muted-foreground text-sm">
            Create a collection from the sidebar to start tracking todos.
          </p>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset className="flex min-h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-5" />
        <span
          aria-hidden
          className="size-3 rounded-full"
          style={{ backgroundColor: selected.color }}
        />
        <h1 className="truncate font-heading font-semibold text-sm">{selected.name}</h1>
        <Badge variant="secondary" className="ml-1">
          {selected.todoCount} {selected.todoCount === 1 ? "task" : "tasks"}
        </Badge>
      </header>
      <ScrollArea className="flex-1">
        <div className="mx-auto w-full max-w-2xl space-y-6 p-4 md:p-6">
          <AddTodoForm collectionId={selected.id} />
          <TodoList collectionId={selected.id} />
        </div>
      </ScrollArea>
    </SidebarInset>
  );
}

export function TodoPanelFallback() {
  return (
    <SidebarInset className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-5" />
        <Skeleton className="h-5 w-40" />
      </header>
      <div className="mx-auto w-full max-w-2xl space-y-6 p-4 md:p-6">
        <Skeleton className="h-9 w-full" />
        <TodoListFallback />
      </div>
    </SidebarInset>
  );
}

// Re-exported so route files stay thin; keeps form infra exercised for future edits.
export function useTodoFormInfra() {
  return { useAppForm, z };
}

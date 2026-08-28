import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  ListTodo,
  LogOut,
  Menu,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {authClient} from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import type { getWorkspace } from "./workspace.functions";
import {
  createList,
  createTodo,
  deleteList,
  deleteTodo,
  listColors,
  toggleTodo,
} from "./workspace.functions";
import { workspaceKeys } from "./workspace.queries";

type WorkspaceData = Awaited<ReturnType<typeof getWorkspace>>;
type WorkspaceList = WorkspaceData["lists"][number];

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

async function refreshWorkspace(queryClient: QueryClient) {
  await queryClient.invalidateQueries({
    queryKey: workspaceKeys.detail(),
    exact: true,
  });
}

export function Workspace({
  data,
  selectedListId,
}: {
  data: WorkspaceData;
  selectedListId?: string;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeList = data.lists.find((list) => list.id === selectedListId) ?? data.lists.at(0);
  const activeTodos = activeList ? data.todos.filter((todo) => todo.listId === activeList.id) : [];

  return (
    <main className="workspace-shell min-h-svh bg-[#f3efe5] text-[#202925]">
      <div className="mx-auto grid min-h-svh max-w-[1680px] md:grid-cols-[290px_1fr]">
        <aside className="hidden border-[#203a34]/10 border-r bg-[#e9e2d4] md:block">
          <ListRail data={data} activeList={activeList} />
        </aside>

        <section className="min-w-0">
          <header className="flex h-20 items-center justify-between border-[#203a34]/10 border-b px-5 sm:px-8 md:px-12">
            <div className="flex items-center gap-3">
              <Button
                className="-ml-2 md:hidden"
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Open lists"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu />
              </Button>
              <div>
                <p className="font-bold text-[#917f67] text-[0.68rem] uppercase tracking-[0.2em]">
                  My workspace
                </p>
                <p className="mt-0.5 text-[#5f6e68] text-sm">{data.user.email}</p>
              </div>
            </div>
            {activeList && (
              <div className="hidden items-center gap-2 text-[#5f6e68] text-sm sm:flex">
                <span className="size-2 rounded-full" style={{ background: activeList.color }} />
                {activeTodos.filter((todo) => !todo.completed).length} open
              </div>
            )}
          </header>

          <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 md:px-12 md:py-12">
            {activeList ? <TodoPanel list={activeList} todos={activeTodos} /> : <EmptyWorkspace />}
          </div>
        </section>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-[#132720]/45 backdrop-blur-sm"
            aria-label="Close lists"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative h-full w-[min(88vw,330px)] bg-[#e9e2d4] shadow-2xl">
            <Button
              className="absolute top-5 right-5 z-10"
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Close lists"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X />
            </Button>
            <ListRail
              data={data}
              activeList={activeList}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </aside>
        </div>
      )}
    </main>
  );
}

function ListRail({
  data,
  activeList,
  onNavigate,
}: {
  data: WorkspaceData;
  activeList?: WorkspaceList;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addingList, setAddingList] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<(typeof listColors)[number]>(listColors[0]);

  const createMutation = useMutation({
    mutationFn: (input: { name: string; color: (typeof listColors)[number] }) =>
      createList({ data: input }),
    onSuccess: async (list) => {
      setName("");
      setAddingList(false);
      await refreshWorkspace(queryClient);
      await navigate({ to: "/", search: { list: list.id } });
      onNavigate?.();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (listId: string) => deleteList({ data: { listId } }),
    onSuccess: async () => {
      await refreshWorkspace(queryClient);
      await navigate({ to: "/", search: {} });
    },
  });

  function submitList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), color });
  }

  async function handleSignOut() {
    await authClient.signOut();
    queryClient.clear();
    window.location.assign("/login");
  }

  return (
    <div className="flex h-full min-h-svh flex-col px-5 py-6">
      <div className="flex items-center gap-3 px-2">
        <span className="grid size-10 place-items-center rounded-full bg-[#19342f] text-[#f5eee0] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
          <Check className="size-5 stroke-[3]" />
        </span>
        <div>
          <p className="font-extrabold text-base uppercase tracking-[0.16em]">Doto</p>
          <p className="text-[#7d776d] text-xs">Make space to think.</p>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between px-2">
        <p className="font-bold text-[#857863] text-[0.68rem] uppercase tracking-[0.2em]">
          Your lists
        </p>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Create a new list"
          onClick={() => setAddingList((value) => !value)}
        >
          {addingList ? <X /> : <Plus />}
        </Button>
      </div>

      {addingList && (
        <form
          className="mt-3 rounded-2xl border border-[#28423b]/10 bg-[#f5f0e6] p-3 shadow-sm"
          onSubmit={submitList}
        >
          <label className="font-semibold text-[#5c645f] text-xs" htmlFor="new-list-name">
            List name
          </label>
          <input
            id="new-list-name"
            className="mt-1.5 h-10 w-full rounded-xl border border-[#243a34]/12 bg-white/70 px-3 text-sm outline-none focus:border-[#2a9d8f] focus:ring-3 focus:ring-[#2a9d8f]/10"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Home"
            maxLength={60}
            autoFocus
          />
          <fieldset className="mt-3">
            <legend className="sr-only">List color</legend>
            <div className="flex items-center gap-2">
              {listColors.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-label={`Use color ${option}`}
                  aria-pressed={color === option}
                  className={cn(
                    "size-7 rounded-full border-2 border-[#f5f0e6] ring-offset-1 transition-transform hover:scale-110",
                    color === option && "scale-110 ring-2 ring-[#304a43]",
                  )}
                  style={{ background: option }}
                  onClick={() => setColor(option)}
                />
              ))}
            </div>
          </fieldset>
          {createMutation.error && (
            <p className="mt-2 text-red-700 text-xs">{errorMessage(createMutation.error)}</p>
          )}
          <Button
            className="mt-3 w-full bg-[#19342f] text-[#f8f4ea] hover:bg-[#264a42]"
            type="submit"
            disabled={createMutation.isPending || !name.trim()}
          >
            {createMutation.isPending ? "Creating…" : "Create list"}
          </Button>
        </form>
      )}

      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto py-2" aria-label="Todo lists">
        {data.lists.map((list) => {
          const count = data.todos.filter(
            (todo) => todo.listId === list.id && !todo.completed,
          ).length;
          const isActive = activeList?.id === list.id;

          return (
            <div key={list.id} className="group/list relative">
              <Link
                to="/"
                search={{ list: list.id }}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 pr-10 font-semibold text-sm transition-all",
                  isActive
                    ? "bg-[#fffaf0] text-[#1e302b] shadow-[0_8px_22px_rgba(48,43,34,0.08)]"
                    : "text-[#5d655f] hover:bg-white/45 hover:text-[#1e302b]",
                )}
                onClick={onNavigate}
              >
                <span className="size-2.5 rounded-full" style={{ background: list.color }} />
                <span className="min-w-0 flex-1 truncate">{list.name}</span>
                <span className="font-medium text-[#9a9183] text-xs">{count}</span>
                {isActive && <ChevronRight className="size-3.5 text-[#9a9183]" />}
              </Link>
              {data.lists.length > 1 && (
                <button
                  type="button"
                  className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-[#9b8f7e] opacity-0 transition hover:bg-red-50 hover:text-red-700 focus:opacity-100 group-hover/list:opacity-100"
                  aria-label={`Delete ${list.name}`}
                  onClick={() => {
                    if (window.confirm(`Delete “${list.name}” and all its to-dos?`)) {
                      deleteMutation.mutate(list.id);
                    }
                  }}
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-5 border-[#304a43]/10 border-t pt-5">
        <div className="flex items-center gap-3 px-2">
          <span className="grid size-9 place-items-center rounded-full bg-[#19342f] font-bold text-[#f8f4ea] text-sm">
            {(data.user.name || data.user.email).slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-sm">{data.user.name}</p>
            <p className="truncate text-[#827b70] text-xs">{data.user.email}</p>
          </div>
          <Button size="icon-sm" variant="ghost" aria-label="Sign out" onClick={handleSignOut}>
            <LogOut />
          </Button>
        </div>
      </div>
    </div>
  );
}

function TodoPanel({ list, todos }: { list: WorkspaceList; todos: WorkspaceData["todos"] }) {
  const queryClient = useQueryClient();
  const [newTodoName, setNewTodoName] = useState("");

  const openTodos = useMemo(() => todos.filter((todo) => !todo.completed), [todos]);
  const completedTodos = useMemo(() => todos.filter((todo) => todo.completed), [todos]);
  const completion = todos.length ? Math.round((completedTodos.length / todos.length) * 100) : 0;

  const createMutation = useMutation({
    mutationFn: (name: string) => createTodo({ data: { listId: list.id, name } }),
    onSuccess: async () => {
      setNewTodoName("");
      await refreshWorkspace(queryClient);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (input: { todoId: string; completed: boolean }) => toggleTodo({ data: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: workspaceKeys.detail() });
      const previous = queryClient.getQueryData<WorkspaceData>(workspaceKeys.detail());

      queryClient.setQueryData<WorkspaceData>(workspaceKeys.detail(), (current) =>
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
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(workspaceKeys.detail(), context.previous);
      }
    },
    onSettled: () => refreshWorkspace(queryClient),
  });

  const deleteMutation = useMutation({
    mutationFn: (todoId: string) => deleteTodo({ data: { todoId } }),
    onSuccess: () => refreshWorkspace(queryClient),
  });

  function submitTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTodoName.trim()) return;
    createMutation.mutate(newTodoName.trim());
  }

  return (
    <div className="animate-workspace-in">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-4 flex items-center gap-2 font-bold text-[#847863] text-xs uppercase tracking-[0.18em]">
            <span className="size-2 rounded-full" style={{ background: list.color }} />
            Personal list
          </div>
          <h1 className="font-heading font-medium text-5xl leading-none tracking-[-0.045em] sm:text-6xl">
            {list.name}
          </h1>
          <p className="mt-4 text-[#6d766f] text-sm">
            {openTodos.length === 0
              ? "All clear. Enjoy the breathing room."
              : `${openTodos.length} ${openTodos.length === 1 ? "thing" : "things"} left to finish.`}
          </p>
        </div>

        <div className="w-full max-w-48">
          <div className="mb-2 flex justify-between font-semibold text-[#746d62] text-xs">
            <span>Progress</span>
            <span>{completion}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#ded6c8]">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${completion}%`, background: list.color }}
            />
          </div>
        </div>
      </div>

      <form
        className="mt-10 flex items-center gap-3 rounded-2xl border border-[#243a34]/10 bg-[#fcf8ef] p-2.5 pl-4 shadow-[0_12px_35px_rgba(52,45,34,0.06)] focus-within:border-[#2a9d8f]/45 focus-within:ring-4 focus-within:ring-[#2a9d8f]/8"
        onSubmit={submitTodo}
      >
        <Plus className="size-4 shrink-0 text-[#8f8577]" />
        <input
          className="h-10 min-w-0 flex-1 bg-transparent font-medium text-sm outline-none placeholder:text-[#9d9589]"
          value={newTodoName}
          onChange={(event) => setNewTodoName(event.target.value)}
          placeholder={`Add something to ${list.name}…`}
          maxLength={160}
          aria-label="New to-do name"
        />
        <Button
          className="h-10 rounded-xl bg-[#19342f] px-4 text-[#f8f4ea] hover:bg-[#264a42]"
          type="submit"
          disabled={createMutation.isPending || !newTodoName.trim()}
        >
          {createMutation.isPending ? "Adding…" : "Add task"}
        </Button>
      </form>

      {(createMutation.error || toggleMutation.error || deleteMutation.error) && (
        <p role="alert" className="mt-3 text-red-700 text-sm">
          {errorMessage(createMutation.error ?? toggleMutation.error ?? deleteMutation.error)}
        </p>
      )}

      <div className="mt-9 space-y-8">
        <TaskSection
          title="To do"
          count={openTodos.length}
          empty={
            <div className="rounded-3xl border border-[#304a43]/18 border-dashed bg-white/20 px-6 py-12 text-center">
              <CheckCircle2 className="mx-auto size-8 text-[#2a9d8f]" />
              <p className="mt-3 font-heading text-2xl">Nothing waiting on you.</p>
              <p className="mt-1 text-[#77766f] text-sm">Add a task above whenever you’re ready.</p>
            </div>
          }
        >
          {openTodos.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              color={list.color}
              onToggle={(completed) => toggleMutation.mutate({ todoId: todo.id, completed })}
              onDelete={() => deleteMutation.mutate(todo.id)}
            />
          ))}
        </TaskSection>

        {completedTodos.length > 0 && (
          <TaskSection title="Completed" count={completedTodos.length} subdued>
            {completedTodos.map((todo) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                color={list.color}
                onToggle={(completed) => toggleMutation.mutate({ todoId: todo.id, completed })}
                onDelete={() => deleteMutation.mutate(todo.id)}
              />
            ))}
          </TaskSection>
        )}
      </div>
    </div>
  );
}

function TaskSection({
  title,
  count,
  children,
  empty,
  subdued,
}: {
  title: string;
  count: number;
  children?: ReactNode;
  empty?: ReactNode;
  subdued?: boolean;
}) {
  return (
    <section className={cn(subdued && "opacity-75")}>
      <div className="mb-3 flex items-center gap-2 px-1">
        <h2 className="font-extrabold text-[#6f6c64] text-xs uppercase tracking-[0.17em]">
          {title}
        </h2>
        <span className="rounded-full bg-[#dfd7c9] px-2 py-0.5 font-bold text-[#746f67] text-[0.68rem]">
          {count}
        </span>
      </div>
      {count === 0 ? empty : <div className="space-y-2">{children}</div>}
    </section>
  );
}

function TodoRow({
  todo,
  color,
  onToggle,
  onDelete,
}: {
  todo: WorkspaceData["todos"][number];
  color: string;
  onToggle: (completed: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <div className="group/todo flex min-h-16 items-center gap-4 rounded-2xl border border-[#263c36]/8 bg-[#fbf7ed] px-4 py-3 shadow-[0_7px_24px_rgba(48,43,34,0.045)] transition hover:-translate-y-0.5 hover:border-[#263c36]/15 hover:shadow-[0_12px_30px_rgba(48,43,34,0.075)]">
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.completed}
        aria-label={`${todo.completed ? "Mark incomplete" : "Complete"}: ${todo.name}`}
        className="grid size-6 shrink-0 place-items-center rounded-full border-2 transition-transform hover:scale-110"
        style={{
          borderColor: color,
          background: todo.completed ? color : "transparent",
          color: "white",
        }}
        onClick={() => onToggle(!todo.completed)}
      >
        {todo.completed && <Check className="size-3.5 stroke-[3]" />}
      </button>
      <p
        className={cn(
          "min-w-0 flex-1 font-semibold text-[#303934] text-[0.95rem] transition",
          todo.completed && "text-[#898b84] line-through decoration-2",
        )}
      >
        {todo.name}
      </p>
      <button
        type="button"
        className="grid size-8 place-items-center rounded-lg text-[#a19a8f] opacity-0 transition hover:bg-red-50 hover:text-red-700 focus:opacity-100 group-hover/todo:opacity-100"
        aria-label={`Delete ${todo.name}`}
        onClick={onDelete}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

function EmptyWorkspace() {
  return (
    <div className="grid min-h-[60svh] place-items-center text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#19342f] text-[#f8f4ea]">
          <ClipboardList className="size-7" />
        </span>
        <h1 className="mt-6 font-heading font-medium text-4xl">Your first list starts here.</h1>
        <p className="mt-3 text-[#6e756f] text-sm leading-6">
          Open the lists menu and create a place for whatever is on your mind.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 font-bold text-[#a36a4d] text-xs uppercase tracking-[0.16em]">
          <ListTodo className="size-4" /> Organized, one list at a time
        </div>
      </div>
    </div>
  );
}

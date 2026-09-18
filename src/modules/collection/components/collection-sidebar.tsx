import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { EllipsisVerticalIcon, LogOutIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { authClient } from "@/core/auth/lib.client";
import { getError } from "@/lib/error";
import { cn } from "@/lib/utils";
import { colors } from "../constant";
import { collectionsQueries } from "../queries";

type Collection = {
  id: string;
  name: string;
  color: string;
  position: number;
  todoCount: number;
};

type SidebarUser = { id: string; name: string; email: string };

interface CollectionSidebarProps {
  user: SidebarUser;
  collections: Collection[];
  selectedId?: string;
  onSelect: (collectionId: string) => void;
}

/** Picks black or white text so the Add button stays readable on any swatch. */
function readableText(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  const luminance = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  return luminance > 160 ? "#000" : "#fff";
}

export function CollectionSidebar({
  user,
  collections,
  selectedId,
  onSelect,
}: CollectionSidebarProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<(typeof colors)[number]>(colors[0]);

  const createCollectionMutation = useMutation({
    ...collectionsQueries.create(),
    onSuccess: async (collection) => {
      setCreating(false);
      setName("");
      await queryClient.invalidateQueries({ queryKey: collectionsQueries.all });
      onSelect(collection.id);
      toast.add({ type: "success", description: `Collection "${collection.name}" created.` });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        description: getError(error, "We could not create that collection."),
        priority: "high",
      });
    },
  });

  const deleteCollectionMutation = useMutation({
    ...collectionsQueries.delete(),
    onSuccess: async (_data, { collectionId: deletedId }) => {
      await queryClient.invalidateQueries({ queryKey: collectionsQueries.all });
      if (deletedId === selectedId) {
        await navigate({ to: "/", search: {} });
      }
      toast.add({ type: "success", description: "Collection deleted." });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        description: getError(error, "We could not delete that collection."),
        priority: "high",
      });
    },
  });

  const signOut = async () => {
    await authClient.signOut();
    await navigate({ to: "/sign-in" });
  };

  const submitCreate = () => {
    const trimmed = name.trim();
    if (!trimmed || createCollectionMutation.isPending) return;
    createCollectionMutation.mutate({ name: trimmed, color });
  };

  const initials =
    user.name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    user.email[0]?.toUpperCase() ||
    "?";

  return (
    <aside className="flex w-full shrink-0 flex-col border-border/60 border-b bg-sidebar md:h-dvh md:w-72 md:border-r md:border-b-0">
      <div className="px-5 pt-5 font-semibold font-serif text-xl tracking-tight md:px-4 md:pt-6">
        doto<span className="text-[#E76F51]">.</span>
      </div>

      <p className="mt-6 px-3 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.16em]">
        Collections
      </p>

      <nav className="min-h-0 flex-1 overflow-y-auto p-2">
        <ul className="flex gap-1.5 overflow-x-auto md:flex-col md:overflow-x-visible">
          {collections.map((collection) => {
            const active = collection.id === selectedId;
            return (
              <li key={collection.id} className="shrink-0 md:w-full">
                <div
                  className={cn(
                    "group flex cursor-pointer items-center rounded-xl text-sm transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                  style={
                    active
                      ? {
                          backgroundColor: `color-mix(in oklab, ${collection.color} 16%, transparent)`,
                        }
                      : undefined
                  }
                >
                  <button
                    type="button"
                    onClick={() => onSelect(collection.id)}
                    className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-xl px-3 text-left"
                  >
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: collection.color }}
                    />
                    <span className="truncate">{collection.name}</span>
                  </button>
                  <span className="pr-1 text-muted-foreground text-xs tabular-nums">
                    {collection.todoCount}
                  </span>
                  {active && (
                    <button
                      type="button"
                      aria-label={`Delete ${collection.name}`}
                      onClick={() =>
                        deleteCollectionMutation.mutate({ collectionId: collection.id })
                      }
                      disabled={deleteCollectionMutation.isPending}
                      className="mr-2 grid size-6 shrink-0 place-items-center rounded-lg text-muted-foreground/70 transition-colors hover:text-destructive"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {creating && (
        <div className="mx-2 mb-2 rounded-2xl border border-border/70 bg-card/40 p-4">
          <Input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitCreate();
              }
            }}
            placeholder="Name"
            aria-label="Collection name"
            className="h-auto rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="flex items-center gap-2.5 pt-4 pb-1">
            {colors.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`Use color ${swatch}`}
                aria-pressed={color === swatch}
                onClick={() => setColor(swatch)}
                className="size-[18px] rounded-full"
                style={{
                  backgroundColor: swatch,
                  boxShadow:
                    color === swatch
                      ? `0 0 0 2px var(--background), 0 0 0 4px ${swatch}`
                      : undefined,
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 pt-3">
            <Button
              type="button"
              size="sm"
              className="px-4"
              style={{ backgroundColor: color, color: readableText(color) }}
              disabled={!name.trim() || createCollectionMutation.isPending}
              onClick={submitCreate}
            >
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setCreating(false);
                setName("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setCreating(true)}
        className="mx-2 mb-1 flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-muted-foreground text-sm transition-colors hover:bg-accent/50 hover:text-foreground"
      >
        <PlusIcon className="size-4" />
        New collection
      </button>

      <footer className="border-border/60 border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-accent/50"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent font-semibold text-[10px] text-accent-foreground">
                  {initials}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
                  {user.email}
                </span>
                <EllipsisVerticalIcon className="size-4 shrink-0 text-muted-foreground" />
              </button>
            }
          />
          <DropdownMenuContent side="top" align="start">
            <DropdownMenuItem onClick={signOut}>
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </footer>
    </aside>
  );
}

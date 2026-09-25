import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { LogOut, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { useAppForm } from "@/components/form";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { authClient } from "@/core/auth/lib.client";
import { getError } from "@/lib/error";
import { cn } from "@/lib/utils";
import { useCollectionSelection } from "@/modules/collection/components/collection-selection-context";
import { colors } from "@/modules/collection/constant";
import { collectionsQueries } from "@/modules/collection/server/queries";

function CollectionSidebarSkeleton() {
  return (
    <SidebarMenu>
      {Array.from({ length: 5 }).map((_, i) => (
        <SidebarMenuItem key={i}>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function CreateCollectionDialog({ onCreated }: { onCreated: (id: string) => void }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const createMutation = useMutation(collectionsQueries.create());

  const form = useAppForm({
    defaultValues: {
      name: "",
      color: colors[0] as (typeof colors)[number],
    },
    validators: {
      onSubmit: z.object({
        name: z.string().trim().min(1, "Name is required.").max(60),
        color: z.enum(colors),
      }),
    },
    onSubmit: async ({ value }) => {
      try {
        const created = await createMutation.mutateAsync(value);
        await queryClient.invalidateQueries({ queryKey: collectionsQueries.all });
        toast.add({ type: "success", description: `“${created.name}” created.` });
        onCreated(created.id);
        setOpen(false);
        form.reset();
      } catch (error) {
        toast.add({ type: "error", description: getError(error, "Could not create collection.") });
      }
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger
        render={
          <SidebarGroupAction title="New collection">
            <Plus />
            <span className="sr-only">New collection</span>
          </SidebarGroupAction>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>Give it a name and pick a color.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.AppField name="name">
            {(field) => <field.Input label="Name" placeholder="e.g. Groceries" maxLength={60} />}
          </form.AppField>
          <form.AppField name="color">
            {(field) => (
              <field.Color label="Color" hideRandom classNames={{ inputs: "flex-wrap" }} />
            )}
          </form.AppField>
          <DialogFooter>
            <form.AppForm>
              <form.SubmitButton>Create</form.SubmitButton>
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CollectionSidebar() {
  const queryClient = useQueryClient();
  const { setOpenMobile } = useSidebar();
  const { selectedId, select } = useCollectionSelection();
  const collectionsQuery = useSuspenseQuery(collectionsQueries.list());
  const deleteMutation = useMutation(collectionsQueries.delete());

  const user = collectionsQuery.data.user;

  const handleSelect = (id: string) => {
    select(id);
    setOpenMobile(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete “${name}”? Its todos will be deleted too.`)) return;
    try {
      await deleteMutation.mutateAsync({ collectionId: id });
      await queryClient.invalidateQueries({ queryKey: collectionsQueries.all });
      await queryClient.invalidateQueries({ queryKey: ["todos"] });
      toast.add({ type: "success", description: `“${name}” deleted.` });
    } catch (error) {
      toast.add({ type: "error", description: getError(error, "Could not delete collection.") });
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/sign-in";
  };

  const initials = (user?.name ?? user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Doto" className="pointer-events-none">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary font-bold font-heading text-primary-foreground text-sm">
                D
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-heading font-semibold">Doto</span>
                <span className="text-muted-foreground text-xs">Stay on track</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Collections</SidebarGroupLabel>
          <CreateCollectionDialog onCreated={handleSelect} />
          <SidebarGroupContent>
            <SidebarMenu>
              {collectionsQuery.data.collections.map((collection, index) => {
                const isActive = selectedId === collection.id || (!selectedId && index === 0);
                return (
                  <SidebarMenuItem key={collection.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={collection.name}
                      onClick={() => handleSelect(collection.id)}
                    >
                      <span
                        aria-hidden
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: collection.color }}
                      />
                      <span className="truncate">{collection.name}</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      showOnHover
                      title={`Delete ${collection.name}`}
                      onClick={() => handleDelete(collection.id, collection.name)}
                      className="hover:text-destructive"
                    >
                      <Trash2 />
                      <span className="sr-only">Delete {collection.name}</span>
                    </SidebarMenuAction>
                    <span
                      className={cn(
                        "pointer-events-none absolute right-8 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-muted-foreground text-xs tabular-nums group-data-[collapsible=icon]:hidden",
                        isActive && "text-sidebar-accent-foreground",
                      )}
                    >
                      {collection.todoCount}
                    </span>
                  </SidebarMenuItem>
                );
              })}
              {collectionsQuery.data.collections.length === 0 && (
                <li className="px-3 py-6 text-center text-muted-foreground text-xs">
                  No collections yet.
                  <br />
                  Create one with the + button.
                </li>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Separator className="mx-2 w-auto" />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton size="lg" tooltip="Account">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary font-medium text-secondary-foreground text-xs">
                      {initials}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
                      <span className="truncate font-medium text-sm">
                        {user?.name || "Account"}
                      </span>
                      <span className="truncate text-muted-foreground text-xs">{user?.email}</span>
                    </span>
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent align="end" side="top" className="w-56">
                <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          <SidebarMenuItem className="flex justify-end px-2">
            <ModeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function CollectionSidebarFallback() {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <Skeleton className="h-12 w-full" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Collections</SidebarGroupLabel>
          <SidebarGroupContent>
            <CollectionSidebarSkeleton />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function SidebarProviders({ children }: { children: React.ReactNode }) {
  return <TooltipProvider delay={200}>{children}</TooltipProvider>;
}

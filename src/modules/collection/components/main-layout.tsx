import { Suspense } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CollectionSelectionProvider } from "@/modules/collection/components/collection-selection-context";
import {
  CollectionSidebar,
  CollectionSidebarFallback,
  SidebarProviders,
} from "@/modules/collection/components/collection-sidebar";
import { TodoPanel, TodoPanelFallback } from "@/modules/todo/components/todo-panel";

export function MainLayout() {
  return (
    <SidebarProviders>
      <CollectionSelectionProvider>
        <SidebarProvider defaultOpen>
          <Suspense fallback={<CollectionSidebarFallback />}>
            <CollectionSidebar />
          </Suspense>
          <Suspense fallback={<TodoPanelFallback />}>
            <TodoPanel />
          </Suspense>
        </SidebarProvider>
      </CollectionSelectionProvider>
    </SidebarProviders>
  );
}

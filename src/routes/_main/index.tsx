import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_main/")({
  component: Page,
});

function Page() {
  // Rendered inside `src/routes/_main/route.tsx` -> MainLayout (sidebar + todos).
  return null;
}

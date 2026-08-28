import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function getContext() {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      //   onError: (error) => {
      //     toast.error(`Error: ${error.message}`, {
      //       action: {
      //         label: "retry",
      //         onClick: () => {
      //           queryClient.invalidateQueries();
      //         },
      //       },
      //     });
      //   },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 10 * 60_000,
        retry: 1,
        refetchOnWindowFocus: true,
      },
    },
  });

  return {
    queryClient,
  };
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

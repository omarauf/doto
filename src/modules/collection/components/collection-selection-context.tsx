import { createContext, useCallback, useContext, useMemo, useState } from "react";

type SelectionContextValue = {
  selectedId: string | null;
  select: (id: string | null) => void;
};

const CollectionSelectionContext = createContext<SelectionContextValue>({
  selectedId: null,
  select: () => {},
});

export function CollectionSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const select = useCallback((id: string | null) => setSelectedId(id), []);

  const value = useMemo(() => ({ selectedId, select }), [selectedId, select]);

  return (
    <CollectionSelectionContext.Provider value={value}>
      {children}
    </CollectionSelectionContext.Provider>
  );
}

export function useCollectionSelection() {
  return useContext(CollectionSelectionContext);
}

import React, { createContext, useContext, useState, useCallback } from "react";

export type Store = {
  id: number;
  name: string;
};

type StoreContextType = {
  activeStore: Store | null;
  setActiveStore: (store: Store | null, callback?: () => void) => void;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeStore, setActiveStoreState] = useState<Store | null>(null);

  const setActiveStore = useCallback(
    (store: Store | null, callback?: () => void) => {
      setActiveStoreState(store);
      if (callback) callback();
    },
    [],
  );

  return (
    <StoreContext.Provider value={{ activeStore, setActiveStore }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
};

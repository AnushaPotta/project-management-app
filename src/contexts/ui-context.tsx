// src/contexts/ui-context.tsx
import { createContext, useContext, useState } from "react";

interface UIContextType {
  modals: {
    addCard: boolean;
    addColumn: boolean;
    cardDetail: boolean;
  };
  openModal: (modalName: keyof UIContextType["modals"]) => void;
  closeModal: (modalName: keyof UIContextType["modals"]) => void;
  activeColumnId: string | null;
  setActiveColumnId: (columnId: string | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = useState({
    addCard: false,
    addColumn: false,
    cardDetail: false,
  });
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  const openModal = (modalName: keyof UIContextType["modals"]) => {
    setModals((prev) => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: keyof UIContextType["modals"]) => {
    setModals((prev) => ({ ...prev, [modalName]: false }));
  };

  return (
    <UIContext.Provider
      value={{
        modals,
        openModal,
        closeModal,
        activeColumnId,
        setActiveColumnId,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}

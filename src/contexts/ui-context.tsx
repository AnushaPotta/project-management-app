// src/contexts/ui-context.tsx
import { createContext, useContext, useState } from "react";

interface UIContextType {
  modals: {
    addCard: boolean;
    addColumn: boolean;
    cardDetail: boolean;
    addMember: boolean; // Add this modal type
  };
  openModal: (
    modal: "addCard" | "addColumn" | "cardDetail" | "addMember"
  ) => void;
  closeModal: (
    modal: "addCard" | "addColumn" | "cardDetail" | "addMember"
  ) => void;
  activeColumnId: string | null;
  setActiveColumnId: (id: string | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = useState({
    addCard: false,
    addColumn: false,
    cardDetail: false,
    addMember: false, // Initialize the new modal state
  });

  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  const openModal = (
    modal: "addCard" | "addColumn" | "cardDetail" | "addMember"
  ) => {
    setModals({ ...modals, [modal]: true });
  };

  const closeModal = (
    modal: "addCard" | "addColumn" | "cardDetail" | "addMember"
  ) => {
    setModals({ ...modals, [modal]: false });
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

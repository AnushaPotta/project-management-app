// src/contexts/board-context.tsx
import { createContext, useContext, useState, useCallback } from "react";
import { Board, Column, Card, DragItem } from "@/types/board";

interface BoardContextType {
  currentBoard: Board | null;
  setCurrentBoard: (board: Board) => void;
  activeCard: Card | null;
  setActiveCard: (card: Card | null) => void;

  // Column operations
  addColumn: (title: string) => Promise<void>;
  updateColumn: (columnId: string, data: Partial<Column>) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
  moveColumn: (sourceIndex: number, destinationIndex: number) => Promise<void>;

  // Card operations
  addCard: (columnId: string, cardData: Partial<Card>) => Promise<void>;
  updateCard: (cardId: string, data: Partial<Card>) => Promise<void>;
  deleteCard: (cardId: string, columnId: string) => Promise<void>;
  moveCard: (source: DragItem, destination: DragItem) => Promise<void>;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export function BoardProvider({ children }: { children: React.ReactNode }) {
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  // Column operations
  const addColumn = useCallback(
    async (title: string) => {
      if (!currentBoard) return;
      // Add column logic here
      // You'll integrate this with your GraphQL mutation
    },
    [currentBoard]
  );

  const updateColumn = useCallback(
    async (columnId: string, data: Partial<Column>) => {
      if (!currentBoard) return;
      // Update column logic
    },
    [currentBoard]
  );

  const deleteColumn = useCallback(
    async (columnId: string) => {
      if (!currentBoard) return;
      // Delete column logic
    },
    [currentBoard]
  );

  const moveColumn = useCallback(
    async (sourceIndex: number, destinationIndex: number) => {
      if (!currentBoard) return;
      // Move column logic
    },
    [currentBoard]
  );

  // Card operations
  const addCard = useCallback(
    async (columnId: string, cardData: Partial<Card>) => {
      if (!currentBoard) return;
      // Add card logic
    },
    [currentBoard]
  );

  const updateCard = useCallback(
    async (cardId: string, data: Partial<Card>) => {
      if (!currentBoard) return;
      // Update card logic
    },
    [currentBoard]
  );

  const deleteCard = useCallback(
    async (cardId: string, columnId: string) => {
      if (!currentBoard) return;
      // Delete card logic
    },
    [currentBoard]
  );

  const moveCard = useCallback(
    async (source: DragItem, destination: DragItem) => {
      if (!currentBoard) return;
      // Move card logic
    },
    [currentBoard]
  );

  const value = {
    currentBoard,
    setCurrentBoard,
    activeCard,
    setActiveCard,
    addColumn,
    updateColumn,
    deleteColumn,
    moveColumn,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
  };

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
}

// Custom hook to use the board context
export function useBoard() {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error("useBoard must be used within a BoardProvider");
  }
  return context;
}

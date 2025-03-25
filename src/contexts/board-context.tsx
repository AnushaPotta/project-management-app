// src/contexts/board-context.tsx

"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { useMutation } from "@apollo/client";
import {
  UPDATE_BOARD,
  INVITE_MEMBER,
  REMOVE_MEMBER,
  ADD_COLUMN,
  UPDATE_COLUMN_MUTATION,
  DELETE_COLUMN_MUTATION,
  ADD_CARD,
  UPDATE_CARD_MUTATION,
  DELETE_CARD_MUTATION,
  MOVE_CARD,
  MOVE_COLUMN,
} from "@/graphql/board";
import {
  Board,
  Column,
  Card,
  DragItem,
  BoardUpdate,
  CardInput,
} from "@/types/board";

interface BoardContextType {
  currentBoard: Board | null;
  setCurrentBoard: (board: Board) => void;
  activeCard: Card | null;
  setActiveCard: (card: Card | null) => void;

  // Board operations
  updateBoard: (boardId: string, data: BoardUpdate) => Promise<void>;
  inviteMember: (boardId: string, email: string) => Promise<void>;
  removeMember: (boardId: string, memberId: string) => Promise<void>;

  // Column operations
  addColumn: (title: string) => Promise<void>;
  updateColumn: (columnId: string, data: Partial<Column>) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
  moveColumn: (sourceIndex: number, destinationIndex: number) => Promise<void>;

  // Card operations
  addCard: (columnId: string, cardData: CardInput) => Promise<void>;
  updateCard: (cardId: string, data: Partial<Card>) => Promise<void>;
  deleteCard: (cardId: string, columnId: string) => Promise<void>;
  moveCard: (source: DragItem, destination: DragItem) => Promise<void>;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export function BoardProvider({ children }: { children: React.ReactNode }) {
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  // Mutations
  const [updateBoardMutation] = useMutation(UPDATE_BOARD);
  const [inviteMemberMutation] = useMutation(INVITE_MEMBER);
  const [removeMemberMutation] = useMutation(REMOVE_MEMBER);
  const [addColumnMutation] = useMutation(ADD_COLUMN);
  const [updateColumnMutation] = useMutation(UPDATE_COLUMN_MUTATION);
  const [deleteColumnMutation] = useMutation(DELETE_COLUMN_MUTATION);
  const [moveColumnMutation] = useMutation(MOVE_COLUMN);
  const [addCardMutation] = useMutation(ADD_CARD);
  const [updateCardMutation] = useMutation(UPDATE_CARD_MUTATION);
  const [deleteCardMutation] = useMutation(DELETE_CARD_MUTATION);
  const [moveCardMutation] = useMutation(MOVE_CARD);

  // Board operations
  const updateBoard = useCallback(
    async (boardId: string, data: BoardUpdate) => {
      const { data: response } = await updateBoardMutation({
        variables: { id: boardId, input: data },
      });
      setCurrentBoard((prev) =>
        prev ? { ...prev, ...response.updateBoard } : null
      );
    },
    [updateBoardMutation]
  );

  const inviteMember = useCallback(
    async (boardId: string, email: string) => {
      const { data } = await inviteMemberMutation({
        variables: { boardId, email },
      });
      setCurrentBoard((prev) =>
        prev ? { ...prev, ...data.inviteMember } : null
      );
    },
    [inviteMemberMutation]
  );

  const removeMember = useCallback(
    async (boardId: string, memberId: string) => {
      const { data } = await removeMemberMutation({
        variables: { boardId, memberId },
      });
      setCurrentBoard((prev) =>
        prev ? { ...prev, ...data.removeMember } : null
      );
    },
    [removeMemberMutation]
  );

  // Column operations
  const addColumn = useCallback(
    async (title: string) => {
      if (!currentBoard) return;
      const { data } = await addColumnMutation({
        variables: { boardId: currentBoard.id, title },
      });
      setCurrentBoard((prev) => (prev ? { ...prev, ...data.addColumn } : null));
    },
    [currentBoard, addColumnMutation]
  );

  const updateColumn = useCallback(
    async (columnId: string, data: Partial<Column>) => {
      if (!currentBoard) return;
      const { data: response } = await updateColumnMutation({
        variables: { columnId, input: data },
      });
      const updatedColumns = currentBoard.columns.map((col) =>
        col.id === columnId ? { ...col, ...response.updateColumn } : col
      );
      setCurrentBoard((prev) =>
        prev ? { ...prev, columns: updatedColumns } : null
      );
    },
    [currentBoard, updateColumnMutation]
  );

  const deleteColumn = useCallback(
    async (columnId: string) => {
      if (!currentBoard) return;
      await deleteColumnMutation({ variables: { columnId } });
      const updatedColumns = currentBoard.columns.filter(
        (col) => col.id !== columnId
      );
      setCurrentBoard((prev) =>
        prev ? { ...prev, columns: updatedColumns } : null
      );
    },
    [currentBoard, deleteColumnMutation]
  );

  const moveColumn = useCallback(
    async (sourceIndex: number, destinationIndex: number) => {
      if (!currentBoard) return;
      const { data } = await moveColumnMutation({
        variables: {
          boardId: currentBoard.id,
          sourceIndex,
          destinationIndex,
        },
      });
      setCurrentBoard((prev) =>
        prev ? { ...prev, ...data.moveColumn } : null
      );
    },
    [currentBoard, moveColumnMutation]
  );

  // Card operations
  const addCard = useCallback(
    async (columnId: string, cardData: CardInput) => {
      if (!currentBoard) return;
      const { data } = await addCardMutation({
        variables: {
          columnId,
          input: cardData,
        },
      });
      setCurrentBoard((prev) => (prev ? { ...prev, ...data.addCard } : null));
    },
    [currentBoard, addCardMutation]
  );

  const updateCard = useCallback(
    async (cardId: string, data: Partial<Card>) => {
      if (!currentBoard) return;
      const { data: response } = await updateCardMutation({
        variables: { cardId, input: data },
      });
      const updatedColumns = currentBoard.columns.map((col) => ({
        ...col,
        cards: col.cards.map((card) =>
          card.id === cardId ? { ...card, ...response.updateCard } : card
        ),
      }));
      setCurrentBoard((prev) =>
        prev ? { ...prev, columns: updatedColumns } : null
      );
    },
    [currentBoard, updateCardMutation]
  );

  const deleteCard = useCallback(
    async (cardId: string, columnId: string) => {
      if (!currentBoard) return;
      await deleteCardMutation({ variables: { cardId } });
      const updatedColumns = currentBoard.columns.map((col) =>
        col.id === columnId
          ? { ...col, cards: col.cards.filter((card) => card.id !== cardId) }
          : col
      );
      setCurrentBoard((prev) =>
        prev ? { ...prev, columns: updatedColumns } : null
      );
    },
    [currentBoard, deleteCardMutation]
  );

  const moveCard = useCallback(
    async (source: DragItem, destination: DragItem) => {
      if (!currentBoard) return;
      const { data } = await moveCardMutation({
        variables: {
          boardId: currentBoard.id,
          source,
          destination,
        },
      });
      setCurrentBoard((prev) => (prev ? { ...prev, ...data.moveCard } : null));
    },
    [currentBoard, moveCardMutation]
  );

  const value: BoardContextType = {
    currentBoard,
    setCurrentBoard,
    activeCard,
    setActiveCard,
    updateBoard,
    inviteMember,
    removeMember,
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

export function useBoard() {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error("useBoard must be used within a BoardProvider");
  }
  return context;
}

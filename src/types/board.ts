// src/types/board.ts
export interface Board {
  id: string;
  title: string;
  description?: string;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
  order: number;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  order: number;
  columnId: string;
}

export interface DragItem {
  id: string;
  columnId: string;
  index: number;
}

export interface CreateBoardInput {
  title: string;
  description?: string;
}

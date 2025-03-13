// src/types/board.ts
export interface Board {
  id: string;
  title: string;
  background?: string;
  isStarred: boolean;
  members: Member[];
  columns: Column[];
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
  boardId: string;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
  dueDate?: string;
  members?: string[];
  columnId: string;
}

export interface DragItem {
  id: string;
  columnId: string;
  index: number;
}

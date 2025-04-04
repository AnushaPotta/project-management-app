// src/types/board.ts
export interface Board {
  id: string;
  title: string;
  description?: string;
  background?: string;
  isStarred: boolean;
  members: BoardMember[];
  columns: Column[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "owner" | "admin" | "member";
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
  dueDate?: string; // ISO string format
  assignedTo?: string;
  labels?: string[];
}
export interface DragItem {
  id: string;
  columnId: string;
  index: number;
}

export interface BoardUpdate {
  title?: string;
  description?: string;
  background?: string;
  isStarred?: boolean;
  columns?: Column[]; // Added to support column updates
}

export interface CardInput {
  title: string;
  description?: string;
  dueDate?: string;
  assignedTo?: string[];
  labels?: string[];
}

// New interface for column creation/updates
export interface ColumnInput {
  title: string;
}

// New interface for column position updates during drag operations
export interface ColumnOrderUpdate {
  columns: Array<{
    id: string;
    order: number;
  }>;
}

// New interface for card position updates during drag operations
export interface CardOrderUpdate {
  cards: Array<{
    id: string;
    columnId: string;
    order: number;
  }>;
}

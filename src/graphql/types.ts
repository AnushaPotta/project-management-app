// src/graphql/types.ts
export interface Board {
  id: string;
  title: string;
  background?: string;
  isStarred: boolean;
  members: Member[];
}

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface UpdateBoardInput {
  title?: string;
  background?: string;
  isStarred?: boolean;
}

// Add these to your existing graphql/types.ts file

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  boardId: string;
  boardTitle: string;
  userId: string;
  userName: string;
  timestamp: string;
  description: string;
}

export interface DeadlineCard {
  id: string;
  title: string;
  dueDate: string;
  boardId: string;
  boardTitle: string;
  columnId: string;
  columnTitle: string;
}

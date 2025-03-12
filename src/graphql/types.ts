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

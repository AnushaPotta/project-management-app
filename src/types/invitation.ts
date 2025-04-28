// src/types/invitation.ts
export interface Invitation {
  id: string;
  email: string;
  boardId: string;
  inviterId: string;
  inviterName: string;
  boardName: string;
  status: 'pending' | 'accepted' | 'expired' | 'declined';
  role: 'ADMIN' | 'MEMBER';
  createdAt: string | Date;
  expiresAt: string | Date;
  token: string;
}
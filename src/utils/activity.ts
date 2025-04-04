// utils/activity.ts
import { adminDb } from "@/lib/firebase-admin";
import { firestore } from "firebase-admin";

export const logActivity = async (
  userId: string,
  userName: string,
  type: string,
  boardId: string,
  boardTitle: string,
  description: string
) => {
  await adminDb.collection("activities").add({
    userId,
    userName,
    type,
    boardId,
    boardTitle,
    description,
    timestamp: firestore.Timestamp.now(),
  });
};

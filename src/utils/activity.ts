// utils/activity.ts
import { adminDb } from "@/lib/firebase-admin";
import { firestore } from "firebase-admin";

// Define activity data interface
interface ActivityData {
  userId: string;
  userName?: string;
  type?: string;
  boardId?: string;
  boardTitle?: string;
  description?: string;
  action?: string;
  data?: any;
}

export const logActivity = async (activityData: ActivityData) => {
  try {
    const { userId, type, boardId, data = {} } = activityData;
    
    // Fetch user's name if not provided
    let userName = activityData.userName;
    if (!userName) {
      try {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData) {
            userName = userData.name || userData.displayName || userData.email || 'Admin';
          } else {
            userName = 'Admin';
          }
        } else {
          userName = 'Admin';
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        userName = 'Admin';
      }
    }
    
    // Add additional fields if not provided
    const activityRecord = {
      userId,
      userName,
      type: type || 'GENERAL',
      boardId: boardId || null,
      boardTitle: activityData.boardTitle || data?.title || null,
      description: activityData.description || null,
      data,
      timestamp: firestore.Timestamp.now(),
    };
    
    await adminDb.collection("activities").add(activityRecord);
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw to prevent interrupting the main operation
  }
};

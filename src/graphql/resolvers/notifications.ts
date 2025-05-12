import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { UserRecord } from "firebase-admin/auth";

interface Context {
  user: UserRecord;
  [key: string]: any;
}

export const notificationsResolver = async (_: any, args: any, context: Context) => {
  const { user } = context;
  
  if (!user) {
    throw new Error("Authentication required");
  }

  try {
    // Query notifications collection for this user without orderBy to avoid requiring composite index
    const notificationsRef = adminDb.collection('notifications')
      .where('userId', '==', user.uid);
    
    const notificationsSnapshot = await notificationsRef.get();
    
    if (notificationsSnapshot.empty) {
      return [];
    }
    
    // Sort the notifications in memory by createdAt
    const notifications = notificationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        time: data.createdAt ? new Date(data.createdAt.toDate()).toISOString() : new Date().toISOString(),
        read: data.read || false,
        type: data.type || 'default',
        targetId: data.targetId || null,
        userId: data.userId,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      };
    });
    
    // Sort by createdAt in descending order and limit to 10
    return notifications
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map(notification => {
        // Remove the temporary createdAt field we used for sorting
        const { createdAt, ...notificationWithoutCreatedAt } = notification;
        return notificationWithoutCreatedAt;
      });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

export const markNotificationReadResolver = async (_: any, { id }: { id: string }, context: Context) => {
  const { user } = context;
  
  if (!user) {
    throw new Error("Authentication required");
  }

  try {
    // Get the notification and verify it belongs to this user
    const notificationRef = adminDb.collection('notifications').doc(id);
    const notificationDoc = await notificationRef.get();
    
    if (!notificationDoc.exists) {
      throw new Error("Notification not found");
    }
    
    const notificationData = notificationDoc.data() || {};
    
    if (notificationData.userId !== user.uid) {
      throw new Error("Unauthorized");
    }
    
    // Mark as read
    await notificationRef.update({
      read: true,
      updatedAt: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
};

export const markAllNotificationsReadResolver = async (_: any, args: any, context: Context) => {
  const { user } = context;
  
  if (!user) {
    throw new Error("Authentication required");
  }

  try {
    // Find all unread notifications for this user
    const batch = adminDb.batch();
    const notificationsRef = adminDb.collection('notifications')
      .where('userId', '==', user.uid)
      .where('read', '==', false);
    
    const notificationsSnapshot = await notificationsRef.get();
    
    if (notificationsSnapshot.empty) {
      return true;
    }
    
    // Update all in a batch operation
    notificationsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        updatedAt: Timestamp.now()
      });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
};

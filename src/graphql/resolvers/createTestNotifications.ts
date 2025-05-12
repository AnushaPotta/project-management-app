import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export const createTestNotificationResolver = async (_: any, { userId }: { userId: string }) => {
  try {
    // Create a few sample notifications
    const notifications = [
      {
        title: "Card moved to Done",
        description: "Your card 'API Integration' was moved to 'Done'",
        type: "CARD_MOVED",
        read: false,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        title: "New task assigned",
        description: "You were assigned a new task 'Implement notifications'",
        type: "TASK_ASSIGNMENT",
        read: false,
        userId,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000)), // 15 minutes ago
        updatedAt: Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000))
      },
      {
        title: "Comment on your task",
        description: "Admin commented on task 'User authentication'",
        type: "COMMENT",
        read: false,
        userId,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000)), // 1 hour ago
        updatedAt: Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000))
      }
    ];

    // Add them to the database
    const batch = adminDb.batch();
    for (const notification of notifications) {
      const notificationRef = adminDb.collection('notifications').doc();
      batch.set(notificationRef, notification);
    }

    await batch.commit();
    
    console.log(`Created ${notifications.length} test notifications for user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error creating test notifications:", error);
    return false;
  }
};

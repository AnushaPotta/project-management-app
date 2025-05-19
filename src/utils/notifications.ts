import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

interface NotificationData {
  title: string;
  description: string;
  type: string;
  targetId?: string;
  userId: string;
  read?: boolean;
}

/**
 * Creates a notification in Firestore for a specific user
 */
export const createNotification = async (data: NotificationData): Promise<string> => {
  try {
    const notificationData = {
      ...data,
      read: data.read ?? false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const notificationRef = adminDb.collection('notifications').doc();
    await notificationRef.set(notificationData);
    
    console.log(`Created notification: ${notificationData.title} for user ${notificationData.userId}`);
    return notificationRef.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Creates a task assignment notification
 */
export const createTaskAssignmentNotification = async (
  userId: string,
  taskTitle: string,
  boardTitle: string,
  taskId: string,
  assignedBy?: string
): Promise<string> => {
  const assignedByText = assignedBy ? ` by ${assignedBy}` : '';
  
  return createNotification({
    title: 'Task Assigned to You',
    description: `Task '${taskTitle}' in board '${boardTitle}' was assigned to you${assignedByText}`,
    type: 'TASK_ASSIGNMENT',
    targetId: taskId,
    userId
  });
};

/**
 * Creates a card moved notification
 */
export const createCardMovedNotification = async (
  userId: string,
  cardTitle: string,
  sourceColumn: string,
  destinationColumn: string,
  boardTitle: string,
  cardId: string,
  movedBy?: string
): Promise<string> => {
  const movedByText = movedBy ? ` by ${movedBy}` : '';
  
  return createNotification({
    title: 'Card Moved',
    description: `Card '${cardTitle}' was moved from '${sourceColumn}' to '${destinationColumn}' in board '${boardTitle}'${movedByText}`,
    type: 'CARD_MOVED',
    targetId: cardId,
    userId
  });
};

/**
 * Creates a board invitation notification
 */
export const createBoardInviteNotification = async (
  userId: string,
  boardTitle: string,
  boardId: string,
  invitedBy?: string
): Promise<string> => {
  const invitedByText = invitedBy ? ` by ${invitedBy}` : '';
  
  return createNotification({
    title: 'Board Invitation',
    description: `You were invited to collaborate on board '${boardTitle}'${invitedByText}`,
    type: 'BOARD_INVITE',
    targetId: boardId,
    userId
  });
};

/**
 * Creates a comment notification
 */
export const createCommentNotification = async (
  userId: string,
  taskTitle: string,
  boardTitle: string,
  taskId: string,
  commentBy: string
): Promise<string> => {
  return createNotification({
    title: 'New Comment',
    description: `${commentBy} commented on task '${taskTitle}' in board '${boardTitle}'`,
    type: 'COMMENT',
    targetId: taskId,
    userId
  });
};

/**
 * Creates a due date reminder notification
 */
export const createDueDateReminderNotification = async (
  userId: string,
  taskTitle: string,
  boardTitle: string,
  taskId: string,
  dueDate: Date
): Promise<string> => {
  const formattedDate = dueDate.toLocaleDateString();
  
  return createNotification({
    title: 'Task Due Soon',
    description: `Task '${taskTitle}' in board '${boardTitle}' is due on ${formattedDate}`,
    type: 'DUE_DATE_REMINDER',
    targetId: taskId,
    userId
  });
};

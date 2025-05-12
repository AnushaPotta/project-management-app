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
    // Create timestamp for both createdAt and time fields
    const timestamp = Timestamp.now();
    
    const notificationData = {
      ...data,
      read: data.read ?? false,
      createdAt: timestamp,
      updatedAt: timestamp,
      // Add a time field that matches the expected format in the UI
      time: timestamp.toDate().toISOString()
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
 * Creates a task unassignment notification
 */
export const createTaskUnassignmentNotification = async (
  userId: string,
  taskTitle: string,
  boardTitle: string,
  taskId: string,
  unassignedBy?: string
): Promise<string> => {
  const unassignedByText = unassignedBy ? ` by ${unassignedBy}` : '';
  
  return createNotification({
    title: 'Task Unassigned from You',
    description: `You were unassigned from task '${taskTitle}' in board '${boardTitle}'${unassignedByText}`,
    type: 'TASK_UNASSIGNMENT',
    targetId: taskId,
    userId
  });
};

/**
 * Creates a due date changed notification
 */
export const createDueDateChangedNotification = async (
  userId: string,
  taskTitle: string,
  boardTitle: string,
  taskId: string,
  newDueDate: Date,
  changedBy?: string
): Promise<string> => {
  const changedByText = changedBy ? ` by ${changedBy}` : '';
  const formattedDate = newDueDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return createNotification({
    title: 'Due Date Changed',
    description: `Due date for task '${taskTitle}' in board '${boardTitle}' was changed to ${formattedDate}${changedByText}`,
    type: 'DUE_DATE_CHANGED',
    targetId: taskId,
    userId
  });
};

/**
 * Creates a due date approaching notification
 */
export const createDueDateApproachingNotification = async (
  userId: string,
  taskTitle: string,
  boardTitle: string,
  taskId: string,
  dueDate: Date
): Promise<string> => {
  const formattedDate = dueDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return createNotification({
    title: 'Due Date Approaching',
    description: `Task '${taskTitle}' in board '${boardTitle}' is due soon (${formattedDate})`,
    type: 'DUE_DATE_APPROACHING',
    targetId: taskId,
    userId
  });
};

/**
 * Creates an overdue task notification
 */
export const createOverdueTaskNotification = async (
  userId: string,
  taskTitle: string,
  boardTitle: string,
  taskId: string,
  dueDate: Date
): Promise<string> => {
  const formattedDate = dueDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return createNotification({
    title: 'Task Overdue',
    description: `Task '${taskTitle}' in board '${boardTitle}' is overdue (was due on ${formattedDate})`,
    type: 'TASK_OVERDUE',
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

/**
 * Creates a notification when a member accepts a board invitation
 */
export const createInvitationAcceptedNotification = async (
  userId: string,     // Board owner/admin who will receive the notification
  memberName: string, // Name of the person who accepted the invitation
  memberEmail: string,
  boardTitle: string,
  boardId: string
): Promise<string> => {
  return createNotification({
    title: 'Invitation Accepted',
    description: `${memberName || memberEmail} accepted your invitation to board '${boardTitle}'`,
    type: 'INVITATION_ACCEPTED',
    targetId: boardId,
    userId
  });
};

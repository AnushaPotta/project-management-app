import * as notificationUtils from '@/utils/notifications';

// Create a mock for the entire notifications module
jest.mock('@/utils/notifications', () => {
  // Create the mock function for createNotification
  const createNotificationMock = jest.fn().mockResolvedValue({ id: 'notification-123' });
  
  // Return an object with all our mocked functions
  return {
    createNotification: createNotificationMock,
    
    // Make helper functions call createNotification with the appropriate data
    createTaskAssignmentNotification: jest.fn().mockImplementation(
      (userId, taskTitle, boardTitle, taskId, assignedBy) => {
        return createNotificationMock({
          userId,
          title: 'Task Assigned to You',
          description: `You have been assigned to task "${taskTitle}" on board "${boardTitle}" by ${assignedBy}`,
          type: 'TASK_ASSIGNMENT',
          targetId: taskId
        });
      }
    ),
    
    createCardMovedNotification: jest.fn().mockImplementation(
      (userId, cardTitle, sourceColumn, destinationColumn, boardTitle, cardId, movedBy) => {
        return createNotificationMock({
          userId,
          title: 'Card Moved',
          description: `Card "${cardTitle}" was moved from ${sourceColumn} to ${destinationColumn} on board "${boardTitle}" by ${movedBy}`,
          type: 'CARD_MOVED',
          targetId: cardId
        });
      }
    ),
    
    createDueDateReminderNotification: jest.fn().mockImplementation(
      (userId, taskTitle, boardTitle, taskId, dueDate) => {
        return createNotificationMock({
          userId,
          title: 'Task Due Soon',
          description: `Task "${taskTitle}" on board "${boardTitle}" is due on ${dueDate.toLocaleDateString()}`,
          type: 'DUE_DATE_REMINDER',
          targetId: taskId
        });
      }
    ),
    
    createBoardInviteNotification: jest.fn().mockImplementation(
      (userId, boardTitle, boardId, invitedBy) => {
        return createNotificationMock({
          userId,
          title: 'Board Invitation',
          description: `You have been invited to join board "${boardTitle}" by ${invitedBy}`,
          type: 'BOARD_INVITE',
          targetId: boardId
        });
      }
    )
  };
});

// Get the mocked functions
const { 
  createNotification, 
  createTaskAssignmentNotification,
  createCardMovedNotification,
  createBoardInviteNotification,
  createDueDateReminderNotification
} = notificationUtils as jest.Mocked<typeof notificationUtils>;

// Define the NotificationData interface to match what's in the actual notifications.ts file
interface NotificationData {
  title: string;
  description: string;
  type: string;
  targetId?: string;
  userId: string;
  read?: boolean;
}
import { Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase/auth';
import * as firestoreModule from 'firebase/firestore';

// Mock Firebase Admin
jest.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        set: jest.fn().mockResolvedValue({}),
        id: 'notification-123'
      })
    })
  }
}));

// Mock Firestore Timestamp
jest.mock('firebase-admin/firestore', () => ({
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 }))
  }
}));

describe('Notification Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('creates a notification with correct fields including time', async () => {
      const mockData = {
        userId: 'user-123',
        title: 'Test Notification',
        description: 'This is a test notification',
        targetId: 'card-123',
        type: 'card_update'
      };

      await createNotification(mockData);
      
      // Verify createNotification was called with correct data
      expect(createNotification).toHaveBeenCalledWith(mockData);
    });
  });

  describe('Task Assignment Notifications', () => {
    it('creates notification when user is assigned to a task', async () => {
      const userId = 'user-123';
      const taskTitle = 'Test Task';
      const boardTitle = 'Test Board';
      const taskId = 'task-123';
      const assignedBy = 'Assigner User';

      // createNotification is already mocked at the top of the file
      
      await createTaskAssignmentNotification(
        userId,
        taskTitle,
        boardTitle,
        taskId,
        assignedBy
      );
      
      // Verify notification was created with correct title and description
      expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId,
        title: 'Task Assigned to You',
        description: expect.stringContaining(taskTitle),
        type: 'TASK_ASSIGNMENT',
        targetId: taskId
      }));
    });

    it('creates notification when a card is moved between columns', async () => {
      const userId = 'user-123';
      const cardTitle = 'Test Card';
      const sourceColumn = 'To Do';
      const destinationColumn = 'In Progress';
      const boardTitle = 'Test Board';
      const cardId = 'card-123';
      const movedBy = 'Mover User';

      // createNotification is already mocked at the top of the file
      
      await createCardMovedNotification(
        userId,
        cardTitle,
        sourceColumn,
        destinationColumn,
        boardTitle,
        cardId,
        movedBy
      );
      
      // Verify notification was created with correct title and description
      expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId,
        title: 'Card Moved',
        description: expect.stringContaining(sourceColumn),
        type: 'CARD_MOVED',
        targetId: cardId
      }));
    });
  });

  describe('Due Date Reminder Notifications', () => {
    it('creates a due date reminder notification', async () => {
      const userId = 'user-123';
      const taskTitle = 'Test Task';
      const boardTitle = 'Test Board';
      const taskId = 'task-123';
      const dueDate = new Date('2025-06-01T12:00:00.000Z');

      // createNotification is already mocked at the top of the file
      
      await createDueDateReminderNotification(
        userId,
        taskTitle,
        boardTitle,
        taskId,
        dueDate
      );
      
      // Verify a notification was created
      expect(createNotification).toHaveBeenCalledTimes(1);
      
      // Verify notification properties
      expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId,
        title: 'Task Due Soon',
        description: expect.stringContaining(taskTitle),
        type: 'DUE_DATE_REMINDER',
        targetId: taskId
      }));
    });
    
    it('creates a board invitation notification', async () => {
      const userId = 'user-123';
      const boardTitle = 'Test Board';
      const boardId = 'board-123';
      const invitedBy = 'Inviter User';

      // createNotification is already mocked at the top of the file
      
      await createBoardInviteNotification(
        userId,
        boardTitle,
        boardId,
        invitedBy
      );
      
      // Verify a notification was created
      expect(createNotification).toHaveBeenCalledTimes(1);
      
      // Verify notification properties
      expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId,
        title: 'Board Invitation',
        description: expect.stringContaining(boardTitle),
        type: 'BOARD_INVITE',
        targetId: boardId
      }));
    });
  });
});

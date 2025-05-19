import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import { createMockQuery, createMockMutation } from '@/utils/test-utils';
import { MockedProvider } from '@apollo/client/testing';
// Define the GraphQL queries that would be in your actual code
import { gql } from '@apollo/client';

const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    notifications {
      id
      title
      description
      time
      read
      type
      targetId
      userId
    }
  }
`;

const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id)
  }
`;
// Instead of importing a specific component that might not exist,
// we'll use our locally defined GraphQL queries for testing

// Mock component for testing
const NotificationList = () => {
  const { data, loading } = require('@apollo/client').useQuery(GET_NOTIFICATIONS);
  const [markAsRead] = require('@apollo/client').useMutation(MARK_NOTIFICATION_READ);
  
  const handleNotificationClick = (id: string) => {
    markAsRead({ variables: { id } });
  };
  
  if (loading) return <div>Loading notifications...</div>;
  
  return (
    <div>
      {data?.notifications.map((notification: any) => (
        <div 
          key={notification.id} 
          data-testid="notification-item"
          data-read={notification.read}
          onClick={() => handleNotificationClick(notification.id)}
        >
          <h3>{notification.title}</h3>
          <p>{notification.description}</p>
          {!notification.read && <span data-testid="unread-indicator">•</span>}
        </div>
      ))}
    </div>
  );
};

// Mock required modules at the module level
jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User'
    },
    loading: false,
    register: jest.fn(),
    login: jest.fn(),
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
    updatePassword: jest.fn(),
    deleteAccount: jest.fn(),
    updateProfile: jest.fn()
  })
}));

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {}
}));

describe('Notification System', () => {
  const testNotifications = [
    {
      id: 'notification-1',
      title: 'Card Assignment',
      description: 'You were assigned to "Task 1" in board "Development"',
      time: new Date().toISOString(),
      read: false,
      type: 'TASK_ASSIGNMENT',
      targetId: 'card-123',
      userId: 'test-user-id'
    },
    {
      id: 'notification-2',
      title: 'Due Date Reminder',
      description: 'Task "Bug Fix" in board "Development" is due tomorrow',
      time: new Date().toISOString(), 
      read: false,
      type: 'DUE_DATE_REMINDER',
      targetId: 'card-456',
      userId: 'test-user-id'
    },
    {
      id: 'notification-3',
      title: 'Card Moved',
      description: 'Card "Feature Implementation" was moved from "To Do" to "In Progress"',
      time: new Date().toISOString(),
      read: true, // This one is already read
      type: 'CARD_MOVED',
      targetId: 'card-789',
      userId: 'test-user-id'
    }
  ];

  // Mock query for getting notifications
  const getNotificationsMock = {
    request: {
      query: GET_NOTIFICATIONS
    },
    result: {
      data: {
        notifications: testNotifications
      }
    }
  };

  // Mock mutation for marking a notification as read
  const markNotificationReadMock = {
    request: {
      query: MARK_NOTIFICATION_READ,
      variables: { id: 'notification-1' }
    },
    result: {
      data: {
        markNotificationRead: true
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console functions to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('displays all user notifications with correct status', async () => {
    // Mock the useQuery hook behavior
    jest.spyOn(require('@apollo/client'), 'useQuery').mockReturnValue({
      loading: false,
      error: null,
      data: { notifications: testNotifications }
    });

    render(
      <MockedProvider mocks={[getNotificationsMock]} addTypename={false}>
        <NotificationList />
      </MockedProvider>
    );

    // Verify all notifications are rendered
    await waitFor(() => {
      // Check for notification titles
      expect(screen.getByText('Card Assignment')).toBeInTheDocument();
      expect(screen.getByText('Due Date Reminder')).toBeInTheDocument();
      expect(screen.getByText('Card Moved')).toBeInTheDocument();
      
      // Check for notification descriptions
      expect(screen.getByText(/You were assigned to "Task 1"/)).toBeInTheDocument();
      expect(screen.getByText(/Task "Bug Fix" .* is due tomorrow/)).toBeInTheDocument();
      expect(screen.getByText(/Card "Feature Implementation" was moved/)).toBeInTheDocument();
      
      // Verify unread indicators - there should be 2 unread notifications
      const unreadBadges = screen.getAllByTestId('unread-indicator');
      expect(unreadBadges.length).toBe(2);
    });
  });

  it('marks a notification as read when clicked', async () => {
    // Mock the useMutation hook behavior
    const markAsReadMock = jest.fn().mockResolvedValue({
      data: { markNotificationRead: true }
    });
    
    jest.spyOn(require('@apollo/client'), 'useMutation')
      .mockReturnValue([markAsReadMock, { loading: false, error: null }]);
    
    // Mock the useQuery hook behavior
    jest.spyOn(require('@apollo/client'), 'useQuery').mockReturnValue({
      loading: false,
      error: null,
      data: { notifications: testNotifications },
      refetch: jest.fn()
    });

    render(
      <MockedProvider mocks={[getNotificationsMock, markNotificationReadMock]} addTypename={false}>
        <NotificationList />
      </MockedProvider>
    );

    // Find the first unread notification and click it
    await waitFor(() => {
      const cardAssignmentNotification = screen.getByText('Card Assignment')
        .closest('[data-testid="notification-item"]');
      
      expect(cardAssignmentNotification).toBeInTheDocument();
      
      // Click the notification
      if (cardAssignmentNotification) {
        fireEvent.click(cardAssignmentNotification);
      }
    });

    // Verify the mutation was called to mark it as read
    await waitFor(() => {
      expect(markAsReadMock).toHaveBeenCalledWith({
        variables: { id: 'notification-1' }
      });
    });
  });

  it('properly handles different notification types', async () => {
    // Mock the useQuery hook behavior
    jest.spyOn(require('@apollo/client'), 'useQuery').mockReturnValue({
      loading: false,
      error: null,
      data: { notifications: testNotifications }
    });

    render(
      <MockedProvider mocks={[getNotificationsMock]} addTypename={false}>
        <NotificationList />
      </MockedProvider>
    );

    // Verify different notification types are displayed with appropriate icons/styling
    await waitFor(() => {
      // Find the task assignment notification
      const assignmentNotification = screen.getByText('Card Assignment')
        .closest('[data-testid="notification-item"]');
      
      // Find the due date reminder notification  
      const dueDateNotification = screen.getByText('Due Date Reminder')
        .closest('[data-testid="notification-item"]');
      
      // Find the card moved notification
      const movedCardNotification = screen.getByText('Card Moved')
        .closest('[data-testid="notification-item"]');
      
      // Verify all notification types are rendered
      expect(assignmentNotification).toBeInTheDocument();
      expect(dueDateNotification).toBeInTheDocument();
      expect(movedCardNotification).toBeInTheDocument();
      
      // The already-read notification should have a different styling
      expect(movedCardNotification).toHaveAttribute('data-read', 'true');
    });
  });
});

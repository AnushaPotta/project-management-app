import { gql } from "@apollo/client";

export const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    notifications {
      id
      title
      description
      time
      read
      type
      targetId
    }
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id)
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

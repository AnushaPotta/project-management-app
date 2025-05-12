import { gql } from "@apollo/client";

export const CREATE_TEST_NOTIFICATIONS = gql`
  mutation CreateTestNotifications($userId: ID!) {
    createTestNotifications(userId: $userId)
  }
`;

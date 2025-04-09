import { gql } from "@apollo/client";

export const GET_TASK_STATS = gql`
  query GetTaskStats {
    taskStats {
      total
      todo
      inProgress
      completed
    }
  }
`;

export const GET_RECENT_ACTIVITY = gql`
  query GetRecentActivity($limit: Int, $cursor: String) {
    recentActivity(limit: $limit, cursor: $cursor) {
      id
      type
      boardId
      boardTitle
      userId
      userName
      timestamp
      description
    }
  }
`;

export const GET_UPCOMING_DEADLINES = gql`
  query GetUpcomingDeadlines($days: Int) {
    upcomingDeadlines(days: $days) {
      id
      title
      dueDate
      boardId
      boardTitle
      columnId
      columnTitle
    }
  }
`;

export const MARK_TASK_COMPLETE = gql`
  mutation MarkTaskComplete($id: ID!) {
    markTaskComplete(id: $id) {
      id
      status
      updatedAt
    }
  }
`;

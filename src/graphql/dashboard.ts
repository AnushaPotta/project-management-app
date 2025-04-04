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
  query GetRecentActivity($limit: Int) {
    recentActivity(limit: $limit) {
      id
      type
      boardId
      boardTitle
      timestamp
      description
      userName
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
      columnTitle
    }
  }
`;

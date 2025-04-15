// src/graphql/search.ts
import { gql } from "@apollo/client";

export const SEARCH_QUERY = gql`
  query Search($query: String!) {
    search(query: $query) {
      id
      type
      title
      boardId
      boardTitle
      columnId
      columnTitle
      dueDate
      description
    }
  }
`;
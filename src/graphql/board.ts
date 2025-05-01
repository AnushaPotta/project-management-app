// src/graphql/board.ts
import { gql } from "@apollo/client";

export const GET_USER_BOARDS = gql`
  query GetUserBoards {
    boards {
      id
      title
      description
      isStarred
      createdAt
      updatedAt
      columns {
        id
        title
        order
        cards {
          id
          title
          description
          order
        }
      }
    }
  }
`;

export const GET_BOARD = gql`
  query GetBoard($id: ID!) {
    board(id: $id) {
      id
      title
      description
      background
      isStarred
      createdAt
      updatedAt
      members {
        id
        name
        email
        avatar
        role
      }
      columns {
        id
        title
        order
        cards {
          id
          title
          description
          order
          columnId
          assignedTo
          dueDate
          labels
        }
      }
    }
  }
`;

export const CREATE_BOARD = gql`
  mutation CreateBoard($title: String!, $description: String) {
    createBoard(title: $title, description: $description) {
      id
      title
      description
      createdAt
      updatedAt
      columns {
        id
        title
        order
        cards {
          id
          title
          description
          order
        }
      }
    }
  }
`;
export const UPDATE_BOARD = gql`
  mutation UpdateBoard($id: ID!, $input: BoardUpdateInput!) {
    updateBoard(id: $id, input: $input) {
      id
      title
      description
      background
      isStarred
    }
  }
`;

export const DELETE_BOARD = gql`
  mutation DeleteBoard($id: ID!) {
    deleteBoard(id: $id)
  }
`;

export const INVITE_MEMBER = gql`
  mutation InviteMember($boardId: ID!, $email: String!) {
    inviteMember(boardId: $boardId, email: $email) {
      id
      members {
        id
        name
        email
        avatar
        role
      }
    }
  }
`;

export const REMOVE_MEMBER = gql`
  mutation RemoveMember($boardId: ID!, $memberId: ID!) {
    removeMember(boardId: $boardId, memberId: $memberId) {
      id
      members {
        id
        name
        email
        avatar
        role
      }
    }
  }
`;

// Column Mutations
export const ADD_COLUMN = gql`
  mutation AddColumn($boardId: ID!, $title: String!) {
    addColumn(boardId: $boardId, title: $title) {
      id
      title
      description
      background
      isStarred
      createdAt
      updatedAt
      members {
        id
        name
        email
        avatar
        role
      }
      columns {
        id
        title
        order
        cards {
          id
          title
          description
          order
          columnId
          assignedTo
          dueDate
          labels
        }
      }
    }
  }
`;

export const UPDATE_COLUMN_MUTATION = gql`
  mutation UpdateColumn($columnId: ID!, $input: ColumnUpdateInput!) {
    updateColumn(columnId: $columnId, input: $input) {
      id
      title
      order
    }
  }
`;

export const DELETE_COLUMN_MUTATION = gql`
  mutation DeleteColumn($columnId: ID!) {
    deleteColumn(columnId: $columnId) {
      id
      columns {
        id
        title
        order
      }
    }
  }
`;

export const MOVE_COLUMN = gql`
  mutation MoveColumn(
    $boardId: ID!
    $sourceIndex: Int!
    $destinationIndex: Int!
  ) {
    moveColumn(
      boardId: $boardId
      sourceIndex: $sourceIndex
      destinationIndex: $destinationIndex
    ) {
      id
      title
      columns {
        id
        title
        order
        cards {
          id
          title
          description
          order
        }
      }
    }
  }
`;

// Card Mutations
export const ADD_CARD = gql`
  mutation AddCard($columnId: ID!, $input: CardInput!) {
    addCard(columnId: $columnId, input: $input) {
      id
      title
      description
      background
      isStarred
      createdAt
      updatedAt
      members {
        id
        name
        email
        avatar
        role
      }
      columns {
        id
        title
        order
        cards {
          id
          title
          description
          order
          columnId
          assignedTo
          dueDate
          labels
        }
      }
    }
  }
`;

export const UPDATE_CARD_MUTATION = gql`
  mutation UpdateCard($cardId: ID!, $input: CardUpdateInput!) {
    updateCard(cardId: $cardId, input: $input) {
      id
      title
      description
      order
      columnId
      assignedTo
      dueDate
      labels
    }
  }
`;

export const DELETE_CARD_MUTATION = gql`
  mutation DeleteCard($cardId: ID!) {
    deleteCard(cardId: $cardId) {
      id
      columns {
        id
        cards {
          id
        }
      }
    }
  }
`;

export const MOVE_CARD = gql`
  mutation MoveCard(
    $boardId: ID!
    $source: DragItemInput!
    $destination: DragItemInput!
  ) {
    moveCard(boardId: $boardId, source: $source, destination: $destination) {
      id
      title
      description
      background
      isStarred
      createdAt
      updatedAt
      members {
        id
        name
        email
        avatar
        role
      }
      columns {
        id
        title
        order
        cards {
          id
          title
          description
          order
          columnId
          assignedTo
          dueDate
          labels
        }
      }
    }
  }
`;

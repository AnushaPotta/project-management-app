// src/graphql/board.ts
import { gql } from "@apollo/client";

export const GET_USER_BOARDS = gql`
  query GetUserBoards {
    boards {
      id
      title
      background
      isStarred
      members {
        id
        name
        email
        avatar
      }
    }
  }
`;

export const GET_BOARD = gql`
  query GetBoard($id: ID!) {
    board(id: $id) {
      id
      title
      background
      isStarred
      members {
        id
        name
        email
        avatar
      }
    }
  }
`;

export const CREATE_BOARD = gql`
  mutation CreateBoard($input: CreateBoardInput!) {
    createBoard(input: $input) {
      id
      title
      background
    }
  }
`;

export const UPDATE_BOARD = gql`
  mutation UpdateBoard($id: ID!, $input: UpdateBoardInput!) {
    updateBoard(id: $id, input: $input) {
      id
      title
      isStarred
    }
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
      }
    }
  }
`;

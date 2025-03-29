// src/graphql/schema.ts
import { gql } from "graphql-tag";

export const typeDefs = `#graphql
  type User {
    id: ID!
    name: String
    email: String!
    avatar: String
    role: String
  }

  type Card {
    id: ID!
    title: String!
    description: String
    order: Int!
    columnId: ID!
    assignedTo: String
    dueDate: String
    labels: [String]
  }

  type Column {
    id: ID!
    title: String!
    order: Int!
    cards: [Card]
  }

  type Board {
    id: ID!
    title: String!
    description: String
    background: String
    isStarred: Boolean
    createdAt: String!
    updatedAt: String!
    members: [User]
    columns: [Column]
  }

  input CreateBoardInput {
    title: String!
    description: String
    background: String
  }

  input BoardUpdateInput {
    title: String
    description: String
    background: String
    isStarred: Boolean
  }

  input CardInput {
    title: String!
    description: String
    assignedTo: String
    dueDate: String
    labels: [String]
  }

  input CardUpdateInput {
    title: String
    description: String
    assignedTo: String
    dueDate: String
    labels: [String]
  }

  input ColumnUpdateInput {
    title: String
  }

  input DragItemInput {
    columnId: ID!
    index: Int!
  }

  type Query {
    boards: [Board]
    board(id: ID!): Board
  }

  type Mutation {
    createBoard(input: CreateBoardInput!): Board
    updateBoard(id: ID!, input: BoardUpdateInput!): Board
    deleteBoard(id: ID!): Boolean

    inviteMember(boardId: ID!, email: String!): Board
    removeMember(boardId: ID!, memberId: ID!): Board

    addColumn(boardId: ID!, title: String!): Board
    updateColumn(columnId: ID!, input: ColumnUpdateInput!): Column
    deleteColumn(columnId: ID!): Board
    moveColumn(boardId: ID!, sourceIndex: Int!, destinationIndex: Int!): Board

    addCard(columnId: ID!, input: CardInput!): Board
    updateCard(cardId: ID!, input: CardUpdateInput!): Card
    deleteCard(cardId: ID!): Board
    moveCard(
      boardId: ID!
      source: DragItemInput!
      destination: DragItemInput!
    ): Board
  }
`;

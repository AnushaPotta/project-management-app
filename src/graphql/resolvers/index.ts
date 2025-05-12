// src/graphql/resolvers/index.ts
import { userProfileResolver } from './userProfile';
import { resolvers as mainResolvers } from '../resolvers';
import { moveCardResolver } from './moveCard';

// Extend resolvers with our custom implementations
export const resolvers = {
  ...mainResolvers,
  Query: {
    ...mainResolvers.Query,
    userProfile: userProfileResolver,
  },
  Mutation: {
    ...mainResolvers.Mutation,
    moveCard: moveCardResolver
  }
};

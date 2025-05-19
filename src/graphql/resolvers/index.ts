// src/graphql/resolvers/index.ts
import { userProfileResolver } from './userProfile';
import { resolvers as mainResolvers } from '../resolvers';

// Extend Query with the userProfile resolver
export const resolvers = {
  ...mainResolvers,
  Query: {
    ...mainResolvers.Query,
    userProfile: userProfileResolver,
  }
};

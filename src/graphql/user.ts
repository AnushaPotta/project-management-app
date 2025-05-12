// src/graphql/user.ts
import { gql } from '@apollo/client';

export const GET_USER_PROFILE = gql`
  query GetUserProfile {
    userProfile {
      id
      name
      email
      avatar
    }
  }
`;

import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { typeDefs } from "@/graphql/schema";
import { resolvers } from "@/graphql/resolvers";
import { getAuth } from 'firebase-admin/auth';
import { db } from '@/lib/firebase';
import { NextRequest } from 'next/server';

// Create Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Create the API route handler with context
const handler = startServerAndCreateNextHandler(server, {
  context: async (req: NextRequest) => {
    try {
      // Get the authorization header
      const authHeader = req.headers.get('authorization') || '';
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided
        return { user: null };
      }
      
      // Extract the token
      const token = authHeader.split('Bearer ')[1];
      
      if (!token) {
        return { user: null };
      }
      
      try {
        // Verify the Firebase token
        const decodedToken = await getAuth().verifyIdToken(token);
        
        // Get the user from Firebase
        const userRecord = await getAuth().getUser(decodedToken.uid);
        
        // Return the user in the context
        return {
          user: userRecord,
          db
        };
      } catch (error) {
        console.error('Error verifying token:', error);
        return { user: null };
      }
    } catch (error) {
      console.error('Error in GraphQL context:', error);
      return { user: null };
    }
  }
});

export { handler as GET, handler as POST };
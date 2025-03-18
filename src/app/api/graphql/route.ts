// src/app/api/graphql/route.ts
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { typeDefs } from "@/graphql/schema";
import { resolvers } from "@/graphql/resolvers";

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Create handler for Next.js API route
const handler = startServerAndCreateNextHandler(server);

// Export the handler for GET and POST requests
export { handler as GET, handler as POST };

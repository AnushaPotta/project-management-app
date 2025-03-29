// src/app/api/graphql/route.ts
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { typeDefs } from "@/graphql/schema";
import { resolvers } from "@/graphql/resolvers";
import { adminAuth } from "@/lib/firebase-admin";
import { NextRequest } from "next/server";

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server, {
  context: async (req: NextRequest) => {
    let user = null;

    // Correctly access headers with Next.js App Router
    const authHeader = req.headers.get("authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7); // Remove "Bearer " prefix

      try {
        user = await adminAuth.verifyIdToken(token);
      } catch (error) {
        console.error("Error verifying auth token:", error);
      }
    }

    return { user };
  },
});

export { handler as GET, handler as POST };

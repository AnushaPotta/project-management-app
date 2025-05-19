import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { typeDefs } from "@/graphql/schema";
import { resolvers as mainResolvers } from "@/graphql/resolvers";
import { resolvers as extendedResolvers } from "@/graphql/resolvers/index";
import { getAuth } from 'firebase-admin/auth';
import { db } from '@/lib/firebase';
import { NextRequest } from 'next/server';
import admin from 'firebase-admin';
import { logActivity } from '@/utils/activity';
import { notificationsResolver, markNotificationReadResolver, markAllNotificationsReadResolver } from '@/graphql/resolvers/notifications';
import { createTestNotificationResolver } from '@/graphql/resolvers/createTestNotifications';
import { moveCardResolver } from '@/graphql/resolvers/moveCard';

// Define interfaces for the updateCard resolver
interface UpdateCardInput {
  title?: string;
  description?: string;
  dueDate?: string;
  assignedTo?: string;
  labels?: string[];
}

interface CardData {
  title: string;
  description?: string;
  dueDate?: string;
  assignedTo?: string;
  labels?: string[];
  updatedAt: admin.firestore.FieldValue | Date;
  [key: string]: any;
}

// Add the missing updateCard resolver
const customResolvers = {
  Mutation: {
    updateCard: async (_: any, { cardId, input }: { cardId: string; input: UpdateCardInput }, { user }: { user: any }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      try {
        console.log(`Updating card ${cardId} with:`, input);
        
        // Get admin firestore instance
        const adminDb = admin.firestore();
        
        // Find the card document to get its columnId
        // First need to find which column it belongs to
        const columnsRef = adminDb.collection("columns");
        const columnsSnapshot = await columnsRef.get();
        
        let cardRef = null;
        let columnDoc = null;
        let boardId = null;

        // Search through all columns to find the card
        for (const colDoc of columnsSnapshot.docs) {
          const cardsRef = colDoc.ref.collection("cards");
          const cardDoc = await cardsRef.doc(cardId).get();
          
          if (cardDoc.exists) {
            cardRef = cardDoc.ref;
            columnDoc = colDoc;
            boardId = colDoc.data().boardId;
            break;
          }
        }

        if (!cardRef || !columnDoc || !boardId) {
          throw new Error("Card not found");
        }

        // Check if user has access to the board this card belongs to
        const boardRef = adminDb.collection("boards").doc(boardId);
        const boardDoc = await boardRef.get();

        if (!boardDoc.exists) {
          throw new Error("Board not found");
        }

        const boardData = boardDoc.data();
        
        // Check authorization - either owner, admin or member
        const isOwner = boardData.userId === user.uid;
        let isMember = boardData.memberIds && boardData.memberIds.includes(user.uid);
        let isAdmin = false;

        if (!isOwner && !isMember) {
          // Check members subcollection
          const membersRef = boardRef.collection("members");
          const memberDoc = await membersRef.doc(user.uid).get();
          
          if (memberDoc.exists) {
            const memberData = memberDoc.data();
            isMember = true;
            isAdmin = memberData.role === "ADMIN";
          }
          
          // Also check by email if not found by ID
          if (!isMember) {
            const membersByEmailQuery = await membersRef
              .where("email", "==", user.email)
              .where("status", "==", "ACCEPTED")
              .get();
              
            isMember = !membersByEmailQuery.empty;
            
            if (isMember && membersByEmailQuery.docs[0].data().role === "ADMIN") {
              isAdmin = true;
            }
          }
        }

        if (!isOwner && !isMember) {
          throw new Error("Not authorized to update cards on this board");
        }

        // Create update data object with only the fields that are provided
        const updateData: Record<string, any> = {
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Only add fields that are explicitly provided in the input
        if (input.title !== undefined) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
        if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo;
        if (input.labels !== undefined) updateData.labels = input.labels;

        // Update the card in Firestore
        await cardRef.update(updateData);
        
        // Get the updated card document
        const updatedCardDoc = await cardRef.get();
        const updatedCardData = updatedCardDoc.data() as CardData;
        
        // Log activity
        try {
          await logActivity({
            type: "CARD_UPDATED",
            userId: user.uid,
            boardId: boardId,
            data: { 
              cardId, 
              cardTitle: updateData.title || updatedCardData?.title || '',
              columnId: columnDoc.id,
              columnTitle: columnDoc.data()?.title || ''
            },
          });
        } catch (logError) {
          console.error("Failed to log activity, but card was updated:", logError);
          // Continue even if logging fails
        }

        // Return the updated card data
        return {
          id: cardId,
          columnId: columnDoc.id,
          ...updatedCardData,
        };
      } catch (error) {
        console.error("Error updating card:", error);
        throw error;
      }
    }
  }
};

// Merge all resolvers together
const mergedResolvers = {
  ...extendedResolvers,  // This includes the userProfile resolver
  Query: {
    ...(mainResolvers.Query || {}),
    ...(extendedResolvers.Query || {}),
    notifications: notificationsResolver
  },
  Mutation: {
    ...(mainResolvers.Mutation || {}),
    ...customResolvers.Mutation,
    markNotificationRead: markNotificationReadResolver,
    markAllNotificationsRead: markAllNotificationsReadResolver,
    createTestNotifications: createTestNotificationResolver,
    moveCard: moveCardResolver
  }
};

// Create Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers: mergedResolvers,
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
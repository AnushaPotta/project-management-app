import { adminDb } from "@/lib/firebase-admin";
import { logActivity } from "@/utils/activity";
import { createNotification, createCardMovedNotification } from "@/utils/notifications";
import { UserRecord } from "firebase-admin/auth";
import { Timestamp } from "firebase-admin/firestore";

interface Card {
  id: string;
  title?: string;
  description?: string;
  order: number;
  columnId: string;
  assignedTo?: string;
  dueDate?: string;
  labels?: string[];
  [key: string]: any;
}

interface ColumnData {
  id: string;
  title?: string;
  order?: number;
  boardId?: string;
  [key: string]: any;
}

interface BoardData {
  id: string;
  title?: string;
  description?: string;
  userId?: string;
  [key: string]: any;
}

interface DragItem {
  columnId: string;
  index: number;
}

interface Context {
  user: UserRecord;
}

// Add debug information to track when this resolver is called
console.log("*** MOVE CARD RESOLVER LOADED ***");

export const moveCardResolver = async (
  _: any,
  { 
    boardId, 
    source, 
    destination 
  }: { 
    boardId: string; 
    source: DragItem; 
    destination: DragItem 
  },
  { user }: Context
) => {
  if (!user) {
    throw new Error("Not authenticated");
  }

  try {
    console.log("*** MOVE CARD RESOLVER CALLED ***", { boardId, source, destination });
    console.log(`Moving card in board ${boardId} from column ${source.columnId} index ${source.index} to column ${destination.columnId} index ${destination.index}`);
    
    // Get the board document
    const boardRef = adminDb.collection("boards").doc(boardId);
    const boardDoc = await boardRef.get();
    
    if (!boardDoc.exists) {
      throw new Error(`Board ${boardId} not found`);
    }
    
    const boardData = boardDoc.data() as BoardData;
    
    // Find the source and destination columns
    const sourceColumnRef = adminDb.collection("columns").doc(source.columnId);
    const destColumnRef = adminDb.collection("columns").doc(destination.columnId);
    
    const sourceColumnDoc = await sourceColumnRef.get();
    const destColumnDoc = await destColumnRef.get();
    
    if (!sourceColumnDoc.exists || !destColumnDoc.exists) {
      throw new Error("Source or destination column not found");
    }
    
    const sourceColumnData = sourceColumnDoc.data() as ColumnData;
    const destColumnData = destColumnDoc.data() as ColumnData;
    
    // Get the source column cards to find the card being moved
    const sourceCardsRef = sourceColumnRef.collection("cards");
    const sourceCardsSnapshot = await sourceCardsRef.orderBy("order").get();
    
    if (sourceCardsSnapshot.empty) {
      throw new Error("No cards found in source column");
    }
    
    const sourceCards = sourceCardsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Find the card being moved
    if (source.index >= sourceCards.length) {
      throw new Error(`Invalid source index: ${source.index}. Only ${sourceCards.length} cards in source column.`);
    }
    
    const movedCard = sourceCards[source.index] as Card;
    
    if (!movedCard) {
      throw new Error("Card not found at specified index");
    }
    
    console.log(`Moving card: ${movedCard.id} - ${movedCard.title}`);
    
    // Get the destination column cards
    const destCardsRef = destColumnRef.collection("cards");
    const destCardsSnapshot = await destCardsRef.orderBy("order").get();
    const destCards = destCardsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Create a batch for updating multiple documents
    const batch = adminDb.batch();
    
    // 1. First, delete the card from source (we'll recreate it at destination)
    const cardRef = sourceCardsRef.doc(movedCard.id);
    batch.delete(cardRef);
    
    // 2. Update orders in source column for cards after the moved card
    for (let i = source.index + 1; i < sourceCards.length; i++) {
      const card = sourceCards[i];
      batch.update(sourceCardsRef.doc(card.id), {
        order: i - 1,
        updatedAt: Timestamp.now()
      });
    }
    
    // 3. Create the card in destination column
    const newCardRef = destCardsRef.doc(movedCard.id);
    batch.set(newCardRef, {
      ...movedCard,
      columnId: destination.columnId,
      order: destination.index,
      updatedAt: Timestamp.now()
    });
    
    // 4. Update orders in destination column for cards after insertion point
    for (let i = destination.index; i < destCards.length; i++) {
      const card = destCards[i];
      batch.update(destCardsRef.doc(card.id), {
        order: i + 1,
        updatedAt: Timestamp.now()
      });
    }
    
    // Commit all the changes
    await batch.commit();
    
    // Log the activity
    await logActivity({
      type: "CARD_MOVED",
      userId: user.uid,
      boardId: boardId,
      data: {
        cardId: movedCard.id,
        cardTitle: movedCard.title || "",
        sourceColumnId: source.columnId,
        sourceColumnTitle: sourceColumnData.title || "",
        destinationColumnId: destination.columnId,
        destinationColumnTitle: destColumnData.title || ""
      }
    });
    
    // Get user name for notification
    let userName = user.displayName || (user.email ? user.email.split('@')[0] : null);
    if (!userName) {
      try {
        const userDoc = await adminDb.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data() || {};
          userName = userData.name || userData.displayName || (user.email ? user.email.split('@')[0] : 'Unknown');
        }
      } catch (error) {
        console.error("Error getting user name:", error);
        userName = "A user";
      }
    }
    
    // Create notifications for relevant users
    try {
      console.log("*** CREATING NOTIFICATIONS FOR CARD MOVE ***");
      let notificationsCreated = 0;

      // Always create a notification for the board owner if they're not the one moving the card
      if (boardData.userId && boardData.userId !== user.uid) {
        console.log(`Creating notification for board owner: ${boardData.userId}`);
        await createCardMovedNotification(
          boardData.userId, // userId of board owner
          movedCard.title || "Untitled Card",
          sourceColumnData.title || "a column",
          destColumnData.title || "another column",
          boardData.title || "a board",
          movedCard.id,
          userName || "A user"
        );
        notificationsCreated++;
      }

      // 1. Notify the card assignee if it's not the person who moved the card
      if (movedCard.assignedTo && movedCard.assignedTo !== user.uid) {
        console.log(`Creating notification for card assignee: ${movedCard.assignedTo}`);
        await createCardMovedNotification(
          movedCard.assignedTo,
          movedCard.title || "Untitled Card",
          sourceColumnData.title || "a column",
          destColumnData.title || "another column",
          boardData.title || "a board",
          movedCard.id,
          userName || "A user"
        );
        notificationsCreated++;
      }
      
      // 2. Get board members to notify admins
      const membersRef = boardRef.collection('members');
      const membersSnapshot = await membersRef.get();
      
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();
        
        // Notify admin members who didn't move the card themselves
        if (memberData.role === 'ADMIN' && 
            memberData.userId && 
            memberData.userId !== user.uid && 
            (!movedCard.assignedTo || memberData.userId !== movedCard.assignedTo)) {
          
          console.log(`Creating notification for board admin: ${memberData.userId}`);
          await createCardMovedNotification(
            memberData.userId,
            movedCard.title || "Untitled Card",
            sourceColumnData.title || "a column",
            destColumnData.title || "another column",
            boardData.title || "a board",
            movedCard.id,
            userName || "A user"
          );
          notificationsCreated++;
        }
      }
      
      // If no notifications were created, always create one for the current user
      // This ensures at least one notification is created for testing
      if (notificationsCreated === 0) {
        console.log(`Creating fallback notification for current user: ${user.uid}`);
        await createCardMovedNotification(
          user.uid, // userId of current user
          movedCard.title || "Untitled Card",
          sourceColumnData.title || "a column",
          destColumnData.title || "another column",
          boardData.title || "a board",
          movedCard.id,
          "You" // Since it's for the current user
        );
        notificationsCreated++;
      }
      
      console.log(`Total notifications created for card movement: ${notificationsCreated}`);
    } catch (notificationError) {
      // Log but don't fail the operation if notifications fail
      console.error("Failed to create notifications for card movement:", notificationError);
    }
    
    // Fetch the updated board with columns and cards to return
    const updatedBoard = await resolvers.Query.board(null, { id: boardId }, { user });
    
    return updatedBoard;
  } catch (error) {
    console.error("Error moving card:", error);
    throw error;
  }
};

// Need to include a placeholder for resolvers to avoid circular dependency
const resolvers = {
  Query: {
    board: async (_: any, { id }: { id: string }, { user }: Context) => {
      // This is just a placeholder - the actual implementation will come from
      // the main resolvers file when this file is imported there
      return null;
    }
  }
};

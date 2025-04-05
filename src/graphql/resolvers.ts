// src/graphql/resolvers.ts
import { adminDb } from "@/lib/firebase-admin";
import { firestore } from "firebase-admin";
import { logActivity } from "@/utils/activity";

interface Context {
  user: any; // Replace with actual user type
}

interface RecentActivityArgs {
  limit?: number;
}

interface UpcomingDeadlinesArgs {
  days?: number;
}

// Add this helper function to the top of your resolvers.ts file:
const formatTimestamp = (timestamp) => {
  try {
    // If it's a Firestore Timestamp with toDate method
    if (
      timestamp &&
      typeof timestamp === "object" &&
      typeof timestamp.toDate === "function"
    ) {
      return timestamp.toDate().toISOString();
    }
    // If it's already a string, return it
    if (typeof timestamp === "string") {
      return timestamp;
    }
    // If it's a Date object
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    // If all else fails, return current date
    return new Date().toISOString();
  } catch (error) {
    console.log("Error formatting timestamp:", error);
    return new Date().toISOString(); // Safe fallback
  }
};

export const resolvers = {
  Query: {
    // Get all boards for the current user - FIXED QUERY
    boards: async (_, __, { user }) => {
      try {
        if (!user) {
          throw new Error("Not authenticated");
        }

        console.log("Fetching boards for user:", user.uid);

        // Better approach: query on memberIds field
        const boardsRef = adminDb.collection("boards");
        const snapshot = await boardsRef
          .where("memberIds", "array-contains", user.uid)
          .get();

        console.log(
          `Found ${snapshot.docs.length} boards for user ${user.uid}`
        );

        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (error) {
        console.error("Error fetching boards:", error);
        throw new Error("Failed to fetch boards");
      }
    },

    // Get a single board by ID
    board: async (_, { id }, { user }) => {
      try {
        if (!user) {
          throw new Error("Not authenticated");
        }

        const docRef = adminDb.collection("boards").doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
          return null;
        }

        // Check if user is a member of this board
        const boardData = docSnap.data();
        if (!boardData) {
          throw new Error("Board data is missing");
        }

        // Check if user is in memberIds array
        if (!boardData.memberIds || !boardData.memberIds.includes(user.uid)) {
          throw new Error("Not authorized to view this board");
        }

        return {
          id: docSnap.id,
          ...boardData,
        };
      } catch (error) {
        console.error("Error fetching board:", error);
        throw new Error("Failed to fetch board");
      }
    },

    // ===== NEW DASHBOARD RESOLVERS ADDED HERE =====
    // Task statistics query
    taskStats: async (_: any, __: any, { user }: Context) => {
      if (!user) throw new Error("Not authenticated");

      const boardsRef = adminDb.collection("boards");
      const snapshot = await boardsRef
        .where("memberIds", "array-contains", user.uid)
        .get();

      let total = 0;
      let todo = 0;
      let inProgress = 0;
      let completed = 0;

      // Count cards in each category
      snapshot.docs.forEach((doc) => {
        const board = doc.data();
        board.columns.forEach((column) => {
          const lowerTitle = column.title.toLowerCase();

          // Count cards in each column
          if (Array.isArray(column.cards)) {
            const cardCount = column.cards.length;
            total += cardCount;

            // Categorize based on column name
            if (
              lowerTitle.includes("todo") ||
              lowerTitle.includes("to do") ||
              lowerTitle.includes("backlog")
            ) {
              todo += cardCount;
            } else if (
              lowerTitle.includes("done") ||
              lowerTitle.includes("complete")
            ) {
              completed += cardCount;
            } else if (
              lowerTitle.includes("progress") ||
              lowerTitle.includes("doing")
            ) {
              inProgress += cardCount;
            } else {
              // Default to in-progress for other columns
              inProgress += cardCount;
            }
          }
        });
      });

      return {
        total,
        todo,
        inProgress,
        completed,
      };
    },

    // Recent activity query
    recentActivity: async (
      _: any,
      { limit = 10 }: RecentActivityArgs,
      { user }: Context
    ) => {
      if (!user) throw new Error("Not authenticated");

      const activitiesRef = adminDb.collection("activities");
      const snapshot = await activitiesRef
        .where("userId", "==", user.uid)
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: formatTimestamp(data.timestamp),
        };
      });
    },

    // Upcoming deadlines query
    upcomingDeadlines: async (
      _: any,
      { days = 7 }: UpcomingDeadlinesArgs,
      { user }: Context
    ) => {
      if (!user) throw new Error("Not authenticated");

      // Calculate the date range
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + days);

      const boardsRef = adminDb.collection("boards");
      const snapshot = await boardsRef
        .where("memberIds", "array-contains", user.uid)
        .get();

      const deadlines = [];

      // Find cards with due dates
      snapshot.docs.forEach((doc) => {
        const board = doc.data();
        const boardId = doc.id;

        board.columns.forEach((column) => {
          if (Array.isArray(column.cards)) {
            column.cards.forEach((card) => {
              if (card.dueDate) {
                const dueDate = new Date(card.dueDate);

                // Check if due date is within range
                if (dueDate >= now && dueDate <= future) {
                  deadlines.push({
                    id: card.id,
                    title: card.title,
                    dueDate: card.dueDate,
                    boardId: boardId,
                    boardTitle: board.title,
                    columnId: column.id,
                    columnTitle: column.title,
                  });
                }
              }
            });
          }
        });
      });

      // Sort by due date (nearest first)
      return deadlines.sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
    },
  },

  Mutation: {
    // Create a new board - UPDATED TO INCLUDE memberIds
    createBoard: async (_, { input }, { user }) => {
      try {
        if (!user) {
          throw new Error("Not authenticated");
        }

        // Create initial member data with the current user as admin
        const currentUser = {
          id: user.uid,
          name: user.name || user.displayName || "User",
          email: user.email || "",
          avatar: user.picture || user.photoURL || null,
          role: "ADMIN",
        };

        // Create board data with memberIds array
        const boardData = {
          title: input.title,
          description: input.description || "",
          background: input.background || "#FFFFFF",
          isStarred: false,
          createdAt: firestore.Timestamp.now(),
          updatedAt: firestore.Timestamp.now(),
          members: [currentUser],
          memberIds: [user.uid], // Add this line with memberIds array
          columns: [],
        };

        // Add to Firestore
        const docRef = await adminDb.collection("boards").add(boardData);

        return {
          id: docRef.id,
          ...boardData,
        };
      } catch (error) {
        console.error("Error creating board:", error);
        throw new Error("Failed to create board");
      }
    },

    // Update a board
    updateBoard: async (_, { id, input }, { user }) => {
      try {
        if (!user) {
          throw new Error("Not authenticated");
        }

        const boardRef = adminDb.collection("boards").doc(id);
        const boardSnap = await boardRef.get();

        if (!boardSnap.exists) {
          throw new Error("Board not found");
        }

        // Check if user is an admin of this board
        const boardData = boardSnap.data();
        if (!boardData) {
          throw new Error("Board data is missing");
        }

        // Check memberIds first (more reliable)
        if (!boardData.memberIds || !boardData.memberIds.includes(user.uid)) {
          throw new Error("Not authorized to update this board");
        }

        const userMember = boardData.members.find(
          (member) => member.id === user.uid
        );

        if (!userMember || userMember.role !== "ADMIN") {
          throw new Error("Not authorized to update this board");
        }

        const updatedData = {
          ...input,
          updatedAt: firestore.Timestamp.now(),
        };

        await boardRef.update(updatedData);

        return {
          id,
          ...boardData,
          ...updatedData,
        };
      } catch (error) {
        console.error("Error updating board:", error);
        throw new Error("Failed to update board");
      }
    },

    // Delete a board
    deleteBoard: async (_, { id }, { user }) => {
      try {
        if (!user) {
          throw new Error("Not authenticated");
        }

        const boardRef = adminDb.collection("boards").doc(id);
        const boardSnap = await boardRef.get();

        if (!boardSnap.exists) {
          throw new Error("Board not found");
        }

        // Check if user is an admin of this board
        const boardData = boardSnap.data();
        if (!boardData) {
          throw new Error("Board data is missing");
        }

        // Check memberIds first (more reliable)
        if (!boardData.memberIds || !boardData.memberIds.includes(user.uid)) {
          throw new Error("Not authorized to delete this board");
        }

        const userMember = boardData.members.find(
          (member) => member.id === user.uid
        );

        if (!userMember || userMember.role !== "ADMIN") {
          throw new Error("Not authorized to delete this board");
        }

        await boardRef.delete();

        return true;
      } catch (error) {
        console.error("Error deleting board:", error);
        throw new Error("Failed to delete board");
      }
    },

    // Add a new column to a board
    addColumn: async (_, { boardId, title }, { user }) => {
      try {
        if (!user) {
          throw new Error("Not authenticated");
        }

        const boardRef = adminDb.collection("boards").doc(boardId);
        const boardSnap = await boardRef.get();

        if (!boardSnap.exists) {
          throw new Error("Board not found");
        }

        // Check if user is a member of this board
        const boardData = boardSnap.data();
        if (!boardData) {
          throw new Error("Board data is missing");
        }

        // Check memberIds first (more reliable)
        if (!boardData.memberIds || !boardData.memberIds.includes(user.uid)) {
          throw new Error("Not authorized to add columns to this board");
        }

        const newColumn = {
          id: firestore.Timestamp.now().toMillis().toString(), // Generate a unique ID
          title: title,
          order: boardData.columns.length,
          cards: [],
        };

        // Add the new column to the columns array
        const updatedColumns = [...boardData.columns, newColumn];

        await boardRef.update({
          columns: updatedColumns,
          updatedAt: firestore.Timestamp.now(),
        });

        return {
          id: boardId,
          ...boardData,
          createdAt: formatTimestamp(boardData.createdAt),
          updatedAt: formatTimestamp(boardData.updatedAt),
          columns: updatedColumns,
        };
      } catch (error) {
        console.error("Error adding column:", error);
        throw new Error("Failed to add column");
      }
    },

    // Update a column
    updateColumn: async (_, { columnId, input }, { user }) => {
      try {
        if (!user) {
          throw new Error("Not authenticated");
        }

        // Find the board containing this column
        const boardsRef = adminDb.collection("boards");
        const querySnapshot = await boardsRef
          .where("memberIds", "array-contains", user.uid)
          .get();

        if (querySnapshot.empty) {
          throw new Error("Column not found or not authorized");
        }

        let foundBoard = null;
        let foundBoardId = null;

        // Find the board with this column
        for (const doc of querySnapshot.docs) {
          const boardData = doc.data();
          if (!boardData || !boardData.columns) continue;

          const hasColumn = boardData.columns.some(
            (col) => col.id === columnId
          );
          if (hasColumn) {
            foundBoard = boardData;
            foundBoardId = doc.id;
            break;
          }
        }

        if (!foundBoard) {
          throw new Error("Column not found");
        }

        // Find the column to update
        const columnIndex = foundBoard.columns.findIndex(
          (col) => col.id === columnId
        );

        if (columnIndex === -1) {
          throw new Error("Column not found");
        }

        // Create updated column data
        const updatedColumn = {
          ...foundBoard.columns[columnIndex],
          ...input,
        };

        // Create a new columns array with the updated column
        const updatedColumns = [...foundBoard.columns];
        updatedColumns[columnIndex] = updatedColumn;

        // Update the board with the new columns array
        await adminDb.collection("boards").doc(foundBoardId).update({
          columns: updatedColumns,
          updatedAt: firestore.Timestamp.now(),
        });

        return updatedColumn;
      } catch (error) {
        console.error("Error updating column:", error);
        throw new Error("Failed to update column");
      }
    },

    // Delete a column
    deleteColumn: async (_, { columnId }, { user }) => {
      try {
        if (!user) {
          throw new Error("Not authenticated");
        }

        // Find the board containing this column using memberIds
        const boardsRef = adminDb.collection("boards");
        const querySnapshot = await boardsRef
          .where("memberIds", "array-contains", user.uid)
          .get();

        if (querySnapshot.empty) {
          throw new Error("Column not found or not authorized");
        }

        let foundBoard = null;
        let foundBoardId = null;

        // Find the board with this column
        for (const doc of querySnapshot.docs) {
          const boardData = doc.data();
          if (!boardData || !boardData.columns) continue;

          const hasColumn = boardData.columns.some(
            (col) => col.id === columnId
          );
          if (hasColumn) {
            foundBoard = boardData;
            foundBoardId = doc.id;
            break;
          }
        }

        if (!foundBoard) {
          throw new Error("Column not found");
        }

        // Filter out the column to delete
        const updatedColumns = foundBoard.columns.filter(
          (col) => col.id !== columnId
        );

        // Update the board with the filtered columns array
        await adminDb.collection("boards").doc(foundBoardId).update({
          columns: updatedColumns,
          updatedAt: firestore.Timestamp.now(),
        });

        return {
          id: foundBoardId,
          ...foundBoard,
          columns: updatedColumns,
        };
      } catch (error) {
        console.error("Error deleting column:", error);
        throw new Error("Failed to delete column");
      }
    },

    // Add a card to a column
    addCard: async (_, { columnId, input }, { user }) => {
      try {
        if (!user) {
          throw new Error("Not authenticated");
        }

        // Find boards where user is a member using memberIds
        const boardsRef = adminDb.collection("boards");
        const querySnapshot = await boardsRef
          .where("memberIds", "array-contains", user.uid)
          .get();

        let targetBoard = null;
        let targetBoardId = null;
        let columnIndex = -1;

        // Manually search for the column in user's boards
        for (const doc of querySnapshot.docs) {
          const boardData = doc.data();
          if (!boardData || !boardData.columns) continue;

          const colIndex = boardData.columns.findIndex(
            (col) => col.id === columnId
          );
          if (colIndex !== -1) {
            targetBoard = boardData;
            targetBoardId = doc.id;
            columnIndex = colIndex;
            break;
          }
        }

        if (!targetBoard || columnIndex === -1) {
          throw new Error("Column not found");
        }

        // Create the new card
        const newCard = {
          id: firestore.Timestamp.now().toMillis().toString(), // Generate a unique ID
          title: input.title,
          description: input.description || "",
          order: targetBoard.columns[columnIndex].cards.length,
          columnId: columnId,
          assignedTo: input.assignedTo || null,
          dueDate: input.dueDate || null,
          labels: input.labels || [],
        };

        // Add the card to the column
        const updatedCards = [
          ...targetBoard.columns[columnIndex].cards,
          newCard,
        ];

        // Update the column with the new cards
        const updatedColumns = [...targetBoard.columns];
        updatedColumns[columnIndex] = {
          ...updatedColumns[columnIndex],
          cards: updatedCards,
        };

        const now = firestore.Timestamp.now();

        // Update the board
        await adminDb.collection("boards").doc(targetBoardId).update({
          columns: updatedColumns,
          updatedAt: now,
        });

        await logActivity(
          user.uid,
          user.displayName || "User",
          "ADD_CARD",
          targetBoardId,
          targetBoard.title,
          `Added card "${input.title}" to column "${targetBoard.columns[columnIndex].title}"`
        );

        // Change to return the updated board with formatted timestamps
        return {
          id: targetBoardId,
          ...targetBoard,
          columns: updatedColumns,
          createdAt: formatTimestamp(targetBoard.createdAt),
          updatedAt: formatTimestamp(now),
        };
      } catch (error) {
        console.error("Error adding card:", error);
        throw new Error("Failed to add card");
      }
    },

    // Update a card
    updateCard: async (_, { cardId, input }, { user }) => {
      try {
        if (!user) {
          throw new Error("Not authenticated");
        }

        // Find boards where user is a member using memberIds
        const boardsRef = adminDb.collection("boards");
        const querySnapshot = await boardsRef
          .where("memberIds", "array-contains", user.uid)
          .get();

        let targetBoard = null;
        let targetBoardId = null;
        let columnIndex = -1;
        let cardIndex = -1;

        // Manually search for the card in user's boards
        for (const doc of querySnapshot.docs) {
          const boardData = doc.data();
          if (!boardData || !boardData.columns) continue;

          // Search each column for the card
          for (let i = 0; i < boardData.columns.length; i++) {
            const column = boardData.columns[i];
            const cIndex = column.cards.findIndex((card) => card.id === cardId);

            if (cIndex !== -1) {
              targetBoard = boardData;
              targetBoardId = doc.id;
              columnIndex = i;
              cardIndex = cIndex;
              break;
            }
          }

          if (targetBoard) break;
        }

        if (!targetBoard || columnIndex === -1 || cardIndex === -1) {
          throw new Error("Card not found");
        }

        // Create updated card
        const updatedCard = {
          ...targetBoard.columns[columnIndex].cards[cardIndex],
          ...input,
        };

        // Update the card in the column
        const updatedCards = [...targetBoard.columns[columnIndex].cards];
        updatedCards[cardIndex] = updatedCard;

        // Update the column with the updated cards
        const updatedColumns = [...targetBoard.columns];
        updatedColumns[columnIndex] = {
          ...updatedColumns[columnIndex],
          cards: updatedCards,
        };

        // Update the board
        await adminDb.collection("boards").doc(targetBoardId).update({
          columns: updatedColumns,
          updatedAt: firestore.Timestamp.now(),
        });

        return updatedCard;
      } catch (error) {
        console.error("Error updating card:", error);
        throw new Error("Failed to update card");
      }
    },

    // Delete a card
    deleteCard: async (_, { cardId }, { user }) => {
      try {
        if (!user) {
          throw new Error("Not authenticated");
        }

        // Find boards where user is a member using memberIds
        const boardsRef = adminDb.collection("boards");
        const querySnapshot = await boardsRef
          .where("memberIds", "array-contains", user.uid)
          .get();

        let targetBoard = null;
        let targetBoardId = null;
        let columnIndex = -1;
        let cardToDelete = null;

        // Manually search for the card in user's boards
        for (const doc of querySnapshot.docs) {
          const boardData = doc.data();
          if (!boardData || !boardData.columns) continue;

          // Search each column for the card
          for (let i = 0; i < boardData.columns.length; i++) {
            const column = boardData.columns[i];
            const cardIndex = column.cards.findIndex(
              (card) => card.id === cardId
            );

            if (cardIndex !== -1) {
              targetBoard = boardData;
              targetBoardId = doc.id;
              columnIndex = i;
              cardToDelete = column.cards[cardIndex];
              break;
            }
          }

          if (targetBoard) break;
        }

        if (!targetBoard || columnIndex === -1 || !cardToDelete) {
          throw new Error("Card not found");
        }

        // Filter out the card to delete
        const updatedCards = targetBoard.columns[columnIndex].cards.filter(
          (card) => card.id !== cardId
        );

        // Update the column with the filtered cards
        const updatedColumns = [...targetBoard.columns];
        updatedColumns[columnIndex] = {
          ...updatedColumns[columnIndex],
          cards: updatedCards,
        };

        if (!targetBoardId) {
          throw new Error("Board ID not found");
        }

        // Update the board
        await adminDb.collection("boards").doc(targetBoardId).update({
          columns: updatedColumns,
          updatedAt: firestore.Timestamp.now(),
        });

        const updatedBoardDoc = await adminDb
          .collection("boards")
          .doc(targetBoardId)
          .get();
        const updatedBoardData = updatedBoardDoc.data();

        return {
          id: targetBoardId, // This fixes "Cannot return null for non-nullable field Board.id"
          ...updatedBoardData,
        };
      } catch (error) {
        console.error("Error deleting card:", error);
        throw new Error("Failed to delete card");
      }
    },

    // Move a card between columns
    moveCard: async (_, { boardId, source, destination }, { user }) => {
      try {
        if (!user) {
          throw new Error("Not authenticated");
        }

        const boardRef = adminDb.collection("boards").doc(boardId);
        const boardSnap = await boardRef.get();

        if (!boardSnap.exists) {
          throw new Error("Board not found");
        }

        // Check if user is a member of this board
        const boardData = boardSnap.data();
        if (!boardData) {
          throw new Error("Board data is missing");
        }

        // Check memberIds first (more reliable)
        if (!boardData.memberIds || !boardData.memberIds.includes(user.uid)) {
          throw new Error("Not authorized to move cards on this board");
        }

        // Find source column
        const sourceColumnIndex = boardData.columns.findIndex(
          (col) => col.id === source.columnId
        );

        if (sourceColumnIndex === -1) {
          throw new Error("Source column not found");
        }

        // Find destination column
        const destColumnIndex = boardData.columns.findIndex(
          (col) => col.id === destination.columnId
        );

        if (destColumnIndex === -1) {
          throw new Error("Destination column not found");
        }

        // Get the card to move
        const cardToMove =
          boardData.columns[sourceColumnIndex].cards[source.index];
        if (!cardToMove) {
          throw new Error("Card not found at source index");
        }

        // Remove card from source column
        const sourceCards = [...boardData.columns[sourceColumnIndex].cards];
        sourceCards.splice(source.index, 1);

        // Create updated source column
        const updatedSourceColumn = {
          ...boardData.columns[sourceColumnIndex],
          cards: sourceCards,
        };

        // Add card to destination column at the specified index
        const destCards = [...boardData.columns[destColumnIndex].cards];
        destCards.splice(destination.index, 0, cardToMove);

        // Create updated destination column
        const updatedDestColumn = {
          ...boardData.columns[destColumnIndex],
          cards: destCards,
        };

        // Update the columns array
        const updatedColumns = [...boardData.columns];
        updatedColumns[sourceColumnIndex] = updatedSourceColumn;
        updatedColumns[destColumnIndex] = updatedDestColumn;

        // Update the board
        await boardRef.update({
          columns: updatedColumns,
          updatedAt: firestore.Timestamp.now(),
        });

        return {
          id: boardId,
          ...boardData,
          columns: updatedColumns,
        };
      } catch (error) {
        console.error("Error moving card:", error);
        throw new Error("Failed to move card");
      }
    },

    // Invite a member to a board - UPDATED to manage memberIds
    inviteMember: async (_, { boardId, email }, { user }) => {
      try {
        if (!user) {
          throw new Error("Not authenticated");
        }

        const boardRef = adminDb.collection("boards").doc(boardId);
        const boardSnap = await boardRef.get();

        if (!boardSnap.exists) {
          throw new Error("Board not found");
        }

        // Check if user is an admin of this board
        const boardData = boardSnap.data();
        if (!boardData) {
          throw new Error("Board data is missing");
        }

        // Check memberIds first (more reliable)
        if (!boardData.memberIds || !boardData.memberIds.includes(user.uid)) {
          throw new Error("Not authorized to invite members to this board");
        }

        const userMember = boardData.members.find(
          (member) => member.id === user.uid
        );

        if (!userMember || userMember.role !== "ADMIN") {
          throw new Error("Not authorized to invite members to this board");
        }

        // Check if email is already a member
        const existingMember = boardData.members.find(
          (member) => member.email === email
        );

        if (existingMember) {
          throw new Error("User is already a member of this board");
        }

        // For simplicity, create a placeholder member
        // In a real app, you might look up the user in your DB
        const newMemberId = email.replace(/[^a-zA-Z0-9]/g, ""); // Generate an ID based on email
        const newMember = {
          id: newMemberId,
          name: email.split("@")[0], // Use part of email as name
          email: email,
          avatar: null,
          role: "MEMBER",
        };

        // Add the new member to the board
        const updatedMembers = [...boardData.members, newMember];

        // Add new member ID to memberIds array
        const updatedMemberIds = boardData.memberIds
          ? [...boardData.memberIds, newMemberId]
          : [user.uid, newMemberId]; // Include current user if memberIds doesn't exist yet

        await boardRef.update({
          members: updatedMembers,
          memberIds: updatedMemberIds, // Update memberIds array
          updatedAt: firestore.Timestamp.now(),
        });

        return {
          id: boardId,
          ...boardData,
          members: updatedMembers,
          memberIds: updatedMemberIds,
        };
      } catch (error) {
        console.error("Error inviting member:", error);
        throw new Error("Failed to invite member");
      }
    },

    // Remove a member from a board - UPDATED to manage memberIds
    removeMember: async (_, { boardId, memberId }, { user }) => {
      try {
        if (!user) {
          throw new Error("Not authenticated");
        }

        const boardRef = adminDb.collection("boards").doc(boardId);
        const boardSnap = await boardRef.get();

        if (!boardSnap.exists) {
          throw new Error("Board not found");
        }

        // Check if user is an admin of this board
        const boardData = boardSnap.data();
        if (!boardData) {
          throw new Error("Board data is missing");
        }

        // Check memberIds first (more reliable)
        if (!boardData.memberIds || !boardData.memberIds.includes(user.uid)) {
          throw new Error("Not authorized to remove members from this board");
        }

        const userMember = boardData.members.find(
          (member) => member.id === user.uid
        );

        if (!userMember || userMember.role !== "ADMIN") {
          throw new Error("Not authorized to remove members from this board");
        }

        // Prevent removing yourself
        if (memberId === user.uid) {
          throw new Error("You cannot remove yourself from the board");
        }

        // Find the member to remove
        const memberToRemove = boardData.members.find(
          (member) => member.id === memberId
        );

        if (!memberToRemove) {
          throw new Error("Member not found");
        }

        // Remove the member from members array
        const updatedMembers = boardData.members.filter(
          (member) => member.id !== memberId
        );

        // Remove the member from memberIds array
        const updatedMemberIds = boardData.memberIds
          ? boardData.memberIds.filter((id) => id !== memberId)
          : [user.uid]; // Fallback if memberIds doesn't exist yet

        // Update the board
        await boardRef.update({
          members: updatedMembers,
          memberIds: updatedMemberIds, // Update memberIds array
          updatedAt: firestore.Timestamp.now(),
        });

        return {
          id: boardId,
          ...boardData,
          members: updatedMembers,
          memberIds: updatedMemberIds,
        };
      } catch (error) {
        console.error("Error removing member:", error);
        throw new Error("Failed to remove member");
      }
    },
  },
};

export default resolvers;

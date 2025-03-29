// src/graphql/resolvers.ts
import { adminDb } from "@/lib/firebase-admin";
import { firestore } from "firebase-admin";

export const resolvers = {
  Query: {
    // Get all boards for the current user
    boards: async (_, __, { user }) => {
      try {
        if (!user) {
          throw new Error("Not authenticated");
        }

        const boardsRef = adminDb.collection("boards");
        const snapshot = await boardsRef
          .where("members", "array-contains", { id: user.uid })
          .get();

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

        const isMember = boardData.members.some(
          (member) => member.id === user.uid
        );

        if (!isMember) {
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
  },

  Mutation: {
    // Create a new board
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

        // Create board data
        const boardData = {
          title: input.title,
          description: input.description || "",
          background: input.background || "#FFFFFF",
          isStarred: false,
          createdAt: firestore.Timestamp.now(),
          updatedAt: firestore.Timestamp.now(),
          members: [currentUser],
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

        const isMember = boardData.members.some(
          (member) => member.id === user.uid
        );

        if (!isMember) {
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
          .where("columns", "array-contains", { id: columnId })
          .get();

        if (querySnapshot.empty) {
          throw new Error("Column not found");
        }

        const boardDoc = querySnapshot.docs[0];
        const boardData = boardDoc.data();
        if (!boardData) {
          throw new Error("Board data is missing");
        }

        // Check if user is a member of this board
        const isMember = boardData.members.some(
          (member) => member.id === user.uid
        );

        if (!isMember) {
          throw new Error("Not authorized to update columns on this board");
        }

        // Find the column to update
        const columnIndex = boardData.columns.findIndex(
          (col) => col.id === columnId
        );

        if (columnIndex === -1) {
          throw new Error("Column not found");
        }

        // Create updated column data
        const updatedColumn = {
          ...boardData.columns[columnIndex],
          ...input,
        };

        // Create a new columns array with the updated column
        const updatedColumns = [...boardData.columns];
        updatedColumns[columnIndex] = updatedColumn;

        // Update the board with the new columns array
        await adminDb.collection("boards").doc(boardDoc.id).update({
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

        // Find the board containing this column
        const boardsRef = adminDb.collection("boards");
        const querySnapshot = await boardsRef
          .where("columns", "array-contains", { id: columnId })
          .get();

        if (querySnapshot.empty) {
          throw new Error("Column not found");
        }

        const boardDoc = querySnapshot.docs[0];
        const boardData = boardDoc.data();
        if (!boardData) {
          throw new Error("Board data is missing");
        }

        // Check if user is a member of this board
        const isMember = boardData.members.some(
          (member) => member.id === user.uid
        );

        if (!isMember) {
          throw new Error("Not authorized to delete columns from this board");
        }

        // Filter out the column to delete
        const updatedColumns = boardData.columns.filter(
          (col) => col.id !== columnId
        );

        // Update the board with the filtered columns array
        await adminDb.collection("boards").doc(boardDoc.id).update({
          columns: updatedColumns,
          updatedAt: firestore.Timestamp.now(),
        });

        return {
          id: boardDoc.id,
          ...boardData,
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

        // Find the board containing this column
        const boardsRef = adminDb.collection("boards");
        const querySnapshot = await boardsRef.get();

        let targetBoard = null;
        let targetBoardId = null;
        let columnIndex = -1;

        // Manually search for the column in all boards
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

        // Check if user is a member of this board
        const isMember = targetBoard.members.some(
          (member) => member.id === user.uid
        );

        if (!isMember) {
          throw new Error("Not authorized to add cards to this board");
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

        // Update the board
        await adminDb.collection("boards").doc(targetBoardId).update({
          columns: updatedColumns,
          updatedAt: firestore.Timestamp.now(),
        });

        return newCard;
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

        // Find the board containing this card (search all boards)
        const boardsRef = adminDb.collection("boards");
        const querySnapshot = await boardsRef.get();

        let targetBoard = null;
        let targetBoardId = null;
        let columnIndex = -1;
        let cardIndex = -1;

        // Manually search for the card in all boards
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

        // Check if user is a member of this board
        const isMember = targetBoard.members.some(
          (member) => member.id === user.uid
        );

        if (!isMember) {
          throw new Error("Not authorized to update cards on this board");
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

        // Find the board containing this card (search all boards)
        const boardsRef = adminDb.collection("boards");
        const querySnapshot = await boardsRef.get();

        let targetBoard = null;
        let targetBoardId = null;
        let columnIndex = -1;
        let cardToDelete = null;

        // Manually search for the card in all boards
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

        // Check if user is a member of this board
        const isMember = targetBoard.members.some(
          (member) => member.id === user.uid
        );

        if (!isMember) {
          throw new Error("Not authorized to delete cards on this board");
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

        // Update the board
        await adminDb.collection("boards").doc(targetBoardId).update({
          columns: updatedColumns,
          updatedAt: firestore.Timestamp.now(),
        });

        return true;
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

        const isMember = boardData.members.some(
          (member) => member.id === user.uid
        );

        if (!isMember) {
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

    // Invite a member to a board
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
        const newMember = {
          id: email.replace(/[^a-zA-Z0-9]/g, ""), // Generate an ID based on email
          name: email.split("@")[0], // Use part of email as name
          email: email,
          avatar: null,
          role: "MEMBER",
        };

        // Add the new member to the board
        const updatedMembers = [...boardData.members, newMember];

        await boardRef.update({
          members: updatedMembers,
          updatedAt: firestore.Timestamp.now(),
        });

        return {
          id: boardId,
          ...boardData,
          members: updatedMembers,
        };
      } catch (error) {
        console.error("Error inviting member:", error);
        throw new Error("Failed to invite member");
      }
    },

    // Remove a member from a board
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

        // Remove the member
        const updatedMembers = boardData.members.filter(
          (member) => member.id !== memberId
        );

        // Update the board
        await boardRef.update({
          members: updatedMembers,
          updatedAt: firestore.Timestamp.now(),
        });

        return {
          id: boardId,
          ...boardData,
          members: updatedMembers,
        };
      } catch (error) {
        console.error("Error removing member:", error);
        throw new Error("Failed to remove member");
      }
    },
  },
};

export default resolvers;

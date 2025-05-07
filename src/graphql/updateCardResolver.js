// File containing just the updateCard resolver code

// Update a card's properties
const updateCardResolver = async (_, { cardId, input }, { user }) => {
  if (!user) {
    throw new Error("Not authenticated");
  }

  try {
    console.log(`Updating card ${cardId} with:`, input);
    
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
    const updateData = {
      updatedAt: firestore.FieldValue.serverTimestamp()
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
    const updatedCardData = updatedCardDoc.data();
    
    // Log activity
    await logActivity({
      type: "CARD_UPDATED",
      userId: user.uid,
      boardId: boardId,
      data: { 
        cardId, 
        cardTitle: updateData.title || updatedCardData.title,
        columnId: columnDoc.id,
        columnTitle: columnDoc.data().title
      },
    });

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
};

// Export the resolver to be used
module.exports = updateCardResolver;

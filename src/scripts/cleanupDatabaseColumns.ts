import { adminDb } from "../lib/firebase-admin";

/**
 * This script removes duplicate and unused columns from the board "project X"
 */
const cleanupColumns = async () => {
  try {
    // Target board ID
    const boardId = "s4jWqr7mGBCY42fzctun"; // project X
    
    // Columns to keep (the ones you're actually using in your UI)
    const columnsToKeep = [
      "Dze6EiEPtfLKUvmHCJ2w", // progress
      "O01wb7KpEHF8TJqY12x1", // Todo
      "WQ6RGfPaVrdBdXpuZ7xF"  // Done
    ];
    
    // Columns to remove (the extra ones with test/dummy data)
    const columnsToRemove = [
      "0uogwxnF0D6SrMXbjQwR", // Todo with test data
      "OFA0ZEMYBi6vNZvUZLrl", // In Progress
      "w75Qxmgf45ERpJ3wYHnh", // Completed  
      "6mrUebhYrhqfV2ByWURu", // ToDo
      "rJH4t9CPMFrrOvTmW171", // Progress
      "pPl8w4qmZZFBZh7q2ED0"  // Todo
    ];
    
    console.log("Starting database cleanup...");
    
    // Get the board reference
    const boardRef = adminDb.collection("boards").doc(boardId);
    const boardDoc = await boardRef.get();
    
    if (!boardDoc.exists) {
      throw new Error(`Board with ID ${boardId} not found!`);
    }
    
    console.log(`Found board: ${boardDoc.data()?.title}`);
    
    // 1. Remove columns from top-level collection
    const batch = adminDb.batch();
    
    for (const columnId of columnsToRemove) {
      const columnRef = adminDb.collection("columns").doc(columnId);
      const columnDoc = await columnRef.get();
      
      if (columnDoc.exists) {
        console.log(`Deleting column: ${columnDoc.data()?.title} (${columnId})`);
        
        // Delete all cards in this column first
        const cardsSnapshot = await columnRef.collection("cards").get();
        if (!cardsSnapshot.empty) {
          console.log(`Deleting ${cardsSnapshot.size} cards from column ${columnId}`);
          
          const cardBatch = adminDb.batch();
          cardsSnapshot.docs.forEach(cardDoc => {
            cardBatch.delete(cardDoc.ref);
          });
          await cardBatch.commit();
        }
        
        // Then delete the column
        batch.delete(columnRef);
      } else {
        console.log(`Column ${columnId} not found, may have been deleted already`);
      }
    }
    
    await batch.commit();
    console.log("Completed removing unused columns!");
    
    // 2. Update the board's columnOrder array to only include columns we're keeping
    const boardData = boardDoc.data();
    
    if (boardData && boardData.columnOrder) {
      const newColumnOrder = boardData.columnOrder.filter((id: string) => columnsToKeep.includes(id));
      console.log(`Updating board column order. Old: ${boardData.columnOrder.length} columns, New: ${newColumnOrder.length} columns`);
      
      await boardRef.update({
        columnOrder: newColumnOrder,
        columnCount: newColumnOrder.length
      });
    }
    
    console.log("Cleanup completed successfully!");
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
};

// Execute the cleanup
cleanupColumns()
  .then(() => {
    console.log("Database cleanup script completed.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Cleanup script error:", error);
    process.exit(1);
  });

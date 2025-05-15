import { NextResponse } from 'next/server';
// Commenting out Firebase Admin import to allow deployment
// import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  // Return mock response for deployment
  return NextResponse.json({ 
    success: true, 
    message: "Cleanup endpoint is temporarily disabled for deployment",
  });
}

/* Original code commented out for deployment
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
    const results = [];
    
    for (const columnId of columnsToRemove) {
      const columnRef = adminDb.collection("columns").doc(columnId);
      const columnDoc = await columnRef.get();
      
      if (columnDoc.exists) {
        const columnData = columnDoc.data();
        console.log(`Deleting column: ${columnData?.title} (${columnId})`);
        results.push(`Deleting column: ${columnData?.title} (${columnId})`);
        
        // Delete all cards in this column first
        const cardsSnapshot = await columnRef.collection("cards").get();
        if (!cardsSnapshot.empty) {
          console.log(`Deleting ${cardsSnapshot.size} cards from column ${columnId}`);
          results.push(`Deleting ${cardsSnapshot.size} cards from column ${columnId}`);
          
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
        results.push(`Column ${columnId} not found, may have been deleted already`);
      }
    }
    
    await batch.commit();
    console.log("Completed removing unused columns!");
    results.push("Completed removing unused columns!");
    
    // 2. Update the board's columnOrder array to only include columns we're keeping
    const boardData = boardDoc.data();
    
    if (boardData && boardData.columnOrder) {
      const newColumnOrder = boardData.columnOrder.filter((id: string) => columnsToKeep.includes(id));
      console.log(`Updating board column order. Old: ${boardData.columnOrder.length} columns, New: ${newColumnOrder.length} columns`);
      results.push(`Updating board column order. Old: ${boardData.columnOrder.length} columns, New: ${newColumnOrder.length} columns`);
      
      await boardRef.update({
        columnOrder: newColumnOrder,
        columnCount: newColumnOrder.length
      });
    }
    
    console.log("Cleanup completed successfully!");
    results.push("Cleanup completed successfully!");

    return NextResponse.json({ 
      success: true, 
      message: "Database cleanup completed successfully", 
      results 
    });
  } catch (error) {
    console.error("Error during cleanup:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Error during cleanup", 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} */

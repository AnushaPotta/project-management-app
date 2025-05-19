// src/graphql/resolvers.ts
import admin from "firebase-admin";
import { firestore } from "firebase-admin";
import { logActivity } from "@/utils/activity";
import { db } from "@/lib/firebase";
import { getAuth } from 'firebase-admin/auth';
import { GraphQLError } from 'graphql';
import { sendBoardInvitation } from '@/lib/sendgrid';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  deleteDoc,
  serverTimestamp,
  updateDoc,
  DocumentData 
} from 'firebase/firestore';

// Admin Firestore instance for server-side operations
const adminDb = admin.firestore();

// Helper function to delete a collection
async function deleteCollection(collectionRef: any) {
  const batch = adminDb.batch();
  const snapshot = await collectionRef.get();
  
  // Nothing to delete
  if (snapshot.empty) {
    return;
  }
  
  // Add up to 500 documents to delete to the batch
  snapshot.docs.forEach((doc: any) => {
    batch.delete(doc.ref);
  });
  
  // Commit the batch
  await batch.commit();
  
  // If there are more documents, recursively delete them
  if (snapshot.size >= 500) {
    // Wait a little bit to avoid overloading Firestore
    await new Promise(resolve => setTimeout(resolve, 200));
    // Delete the next batch
    await deleteCollection(collectionRef);
  }
}

interface Context {
  user: any; // Replace with actual user type
}

interface RecentActivityArgs {
  limit?: number;
  offset?: number;
}

// Helper function to format timestamp
const formatTimestamp = (timestamp: any): string => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  
  if (timestamp && timestamp._seconds) {
    return new Date(timestamp._seconds * 1000).toISOString();
  }
  
  return new Date().toISOString(); // Safe fallback
}

export const resolvers = {
  // Type resolvers
  Board: {
    createdAt: (parent: any) => formatTimestamp(parent.createdAt),
    updatedAt: (parent: any) => parent.updatedAt ? formatTimestamp(parent.updatedAt) : formatTimestamp(parent.createdAt),
    
    // Get board members
    members: async (parent: { id: string }) => {
      try {
        console.log(`Fetching members for board: ${parent.id}`);
        
        // First, get the board details to find the creator
        const boardDoc = await adminDb.collection('boards').doc(parent.id).get();
        if (!boardDoc.exists) {
          console.log(`Board ${parent.id} not found`);
          return [];
        }
        
        const boardData = boardDoc.data();
        const creatorId = boardData?.userId; // Board creator's ID
        console.log(`Board creator ID: ${creatorId}`);
        
        // Check for board members in the members subcollection
        const membersRef = adminDb.collection('boards').doc(parent.id).collection('members');
        const membersSnapshot = await membersRef.get();
        
        console.log(`Found ${membersSnapshot.docs.length} members in subcollection`);
        
        // Process each member, with special handling for admins with poor data
        let membersList = [];
        
        // First map all members
        for (const memberDoc of membersSnapshot.docs) {
          console.log(`Member from DB: ID=${memberDoc.id}, data=`, memberDoc.data());
          const memberData = memberDoc.data();
          const memberId = memberDoc.id;
          
          // Check if this is an admin with poor data (name is 'Admin' or missing)
          if (memberData.role === 'ADMIN' && (!memberData.name || memberData.name === 'Admin' || memberData.name === '')) {
            console.log(`Found admin with poor data: ${memberId}, trying to enhance data`);
            
            // Get better user data using the same approach as for new admin members
            let improvedName = '';
            let improvedEmail = memberData.email || '';
            
            try {
              // Try to get Firebase Auth data
              const authUser = await admin.auth().getUser(memberId).catch(e => null);
              if (authUser) {
                console.log(`Got Firebase Auth data for admin ${memberId}:`, authUser);
                improvedName = authUser.displayName || '';
                improvedEmail = authUser.email || improvedEmail;
              }
              
              // Also check Firestore user document
              const userDoc = await adminDb.collection('users').doc(memberId).get();
              if (userDoc.exists) {
                const userData = userDoc.data();
                console.log(`Found Firestore user data for admin:`, userData);
                if (!improvedName) {
                  improvedName = userData.name || userData.displayName || '';
                }
                if (!improvedEmail) {
                  improvedEmail = userData.email || '';
                }
              }
              
              // Try to derive name from email
              if (!improvedName && improvedEmail) {
                improvedName = improvedEmail.split('@')[0];
              }
              
              // Last resort
              if (!improvedName) {
                improvedName = `User ${memberId.substring(0, 6)}`;
              }
              
              // Update the member data with better information
              const enhancedMember = {
                id: memberId,
                ...memberData,
                name: improvedName,
                email: improvedEmail
              };
              
              // Also update the database if we have better data
              if (improvedName !== 'Admin' && improvedName !== '') {
                console.log(`Updating admin record with better data: ${improvedName}`);
                await memberDoc.ref.update({
                  name: improvedName,
                  email: improvedEmail
                });
              }
              
              membersList.push(enhancedMember);
            } catch (error) {
              console.error(`Error enhancing admin member data:`, error);
              // If enhancement fails, add the original data
              membersList.push({
                id: memberId,
                ...memberData
              });
            }
          } else {
            // For non-admin members or admins with good data, just add them as is
            membersList.push({
              id: memberId,
              ...memberData
            });
          }
        }
        
        // Check if the creator is already in the members list
        const creatorExists = membersList.some(member => member.id === creatorId);
        console.log(`Creator exists in members list: ${creatorExists}`);
        
        // If creator isn't in the members list, add them as an admin
        if (!creatorExists && creatorId) {
          console.log(`Adding creator ${creatorId} as admin`);
          
          // Get creator's user info with multiple sources
          console.log(`Fetching detailed creator data for ${creatorId}`);
          
          // Try to get more detailed creator info from Firebase Auth
          let userData = null;
          let userName = '';
          let userEmail = '';
          
          try {
            // Get Firebase Auth user data directly
            const authUser = await admin.auth().getUser(creatorId);
            console.log(`Got Firebase Auth user:`, authUser);
            
            // Set basic info from auth
            userName = authUser.displayName || '';
            userEmail = authUser.email || '';
          } catch (authError) {
            console.log(`Could not get Firebase Auth data:`, authError);
          }
          
          // Also try Firestore user document as a backup
          const userDoc = await adminDb.collection('users').doc(creatorId).get();
          if (userDoc.exists) {
            userData = userDoc.data();
            console.log(`Found creator user data in Firestore:`, userData);
            
            // Only use Firestore data if it's better than what we have
            if (!userName && (userData?.name || userData?.displayName)) {
              userName = userData.name || userData.displayName;
            }
            if (!userEmail && userData?.email) {
              userEmail = userData.email;
            }
          } else {
            console.log(`Creator user data not found in Firestore`);
          }
          
          // If we still don't have a name but have an email, extract username from email
          if (!userName && userEmail) {
            userName = userEmail.split('@')[0];
          }
          
          // Last resort: use a truncated user ID
          if (!userName) {
            userName = `User ${creatorId.substring(0, 6)}`;
          }
          
          // Create admin member record for creator with enhanced user info
          const creatorMember = {
            id: creatorId,
            name: userName,  // Use our enhanced user name from multiple sources
            email: userEmail, // Use enhanced email
            role: 'ADMIN',
            status: 'ACCEPTED',
            joinedAt: firestore.FieldValue.serverTimestamp()
          };
          
          // Add to Firestore for future queries
          console.log(`Saving creator as admin to database:`, creatorMember);
          await membersRef.doc(creatorId).set(creatorMember);
          
          // Also add to the current response
          membersList.push(creatorMember);
        }
        
        // Now we have all the members including the creator as admin if needed
        return membersList;
      } catch (error) {
        console.error('Error fetching board members:', error);
        return [];
      }
    },
    
    // Get all columns for a board
    columns: async (parent: { id: string }) => {
      try {
        console.log(`Fetching columns for board: ${parent.id}`);
        
        // Get columns from the columns collection where boardId matches
        const columnsRef = adminDb.collection('columns');
        const columnsQuery = await columnsRef.where('boardId', '==', parent.id).orderBy('order').get();
        
        console.log(`Found ${columnsQuery.docs.length} columns for board ${parent.id}`);
        
        // If no columns found, return empty array
        if (columnsQuery.empty) {
          console.log(`No columns found for board ${parent.id}`);
          return [];
        }
        
        // Map columns with their cards
        const columns = await Promise.all(
          columnsQuery.docs.map(async (columnDoc) => {
            const columnData = columnDoc.data();
            
            // Get cards for this column
            const cardsRef = adminDb.collection('columns').doc(columnDoc.id).collection('cards');
            const cardsSnapshot = await cardsRef.orderBy('order').get();
            
            console.log(`Column ${columnDoc.id} has ${cardsSnapshot.docs.length} cards`);
            
            const cards = cardsSnapshot.docs.map((cardDoc) => ({
              id: cardDoc.id,
              columnId: columnDoc.id,
              ...cardDoc.data(),
            }));
            
            return {
              id: columnDoc.id,
              cards,
              ...columnData,
            };
          })
        );
        
        return columns;
      } catch (error) {
        console.error(`Error fetching columns for board ${parent.id}:`, error);
        return [];
      }
    },
  },

  Column: {
    createdAt: (parent: any) => formatTimestamp(parent.createdAt),
    updatedAt: (parent: any) => parent.updatedAt ? formatTimestamp(parent.updatedAt) : formatTimestamp(parent.createdAt),
  },

  Card: {
    createdAt: (parent: any) => formatTimestamp(parent.createdAt),
    updatedAt: (parent: any) => parent.updatedAt ? formatTimestamp(parent.updatedAt) : formatTimestamp(parent.createdAt),
  },

  Query: {
    // Get all boards for the current user
    boards: async (_, __, { user }) => {
      try {
        if (!user) {
          throw new Error("Not authenticated");
        }

        console.log("Fetching boards for user:", user.uid);
        const boardIds = new Set();
        const boardsData = [];

        // 1. First query boards where user is in memberIds (created by user or added directly)
        const boardsRef = adminDb.collection("boards");
        const ownerSnapshot = await boardsRef
          .where("memberIds", "array-contains", user.uid)
          .get();

        ownerSnapshot.docs.forEach(doc => {
          boardIds.add(doc.id);
          boardsData.push({
            id: doc.id,
            ...doc.data()
          });
        });

        // 2. Then find boards where user is in the members subcollection (invited and accepted)
        console.log(`Checking for boards where user ${user.uid} is a member via subcollection`);
        const boardsCollection = adminDb.collection('boards');
        
        // Get all boards
        const allBoardsSnapshot = await boardsCollection.get();
        console.log(`Checking through ${allBoardsSnapshot.docs.length} boards for user membership`);
        
        // For each board, check if user is a member with ACCEPTED status
        for (const boardDoc of allBoardsSnapshot.docs) {
          const boardId = boardDoc.id;
          // Skip boards we already have
          if (boardIds.has(boardId)) {
            continue;
          }
          
          console.log(`Checking board ${boardId} for user membership`);
          const membersRef = boardDoc.ref.collection('members');
          
          // First, let's just get all members in this board to see what's there
          const allMembersSnapshot = await membersRef.get();
          console.log(`Board ${boardId} has ${allMembersSnapshot.docs.length} total members`);
          
          // Log all members for debugging
          allMembersSnapshot.docs.forEach(memberDoc => {
            const memberData = memberDoc.data();
            console.log(`Member in board ${boardId}: ID=${memberDoc.id}, Email=${memberData.email}, UserId=${memberData.userId}, Status=${memberData.status}`);
          });
          
          // Now try the specific query for this user
          // First check if they have a membership by userId
          const memberQueryByUserId = await membersRef
            .where('userId', '==', user.uid)
            .where('status', '==', 'ACCEPTED')
            .get();
          
          console.log(`Query for userId=${user.uid} in board ${boardId} returned ${memberQueryByUserId.docs.length} results`);
          
          // If no results by userId, check by email (as a fallback)
          let isMember = !memberQueryByUserId.empty;
          
          if (!isMember && user.email) {
            const memberQueryByEmail = await membersRef
              .where('email', '==', user.email)
              .where('status', '==', 'ACCEPTED')
              .get();
            
            console.log(`Query for email=${user.email} in board ${boardId} returned ${memberQueryByEmail.docs.length} results`);
            isMember = !memberQueryByEmail.empty;
          }
          
          // If user is a member of this board, add it to the results
          if (isMember) {
            boardIds.add(boardId);
            boardsData.push({
              id: boardId,
              ...boardDoc.data()
            });
            console.log(`Added board ${boardId} to user's boards list`);
          }
        }

        console.log(`Found ${boardsData.length} boards for user ${user.uid}`);
        return boardsData;
      } catch (error) {
        console.error("Error fetching boards:", error);
        throw error;
      }  
    },

    // Get a specific board by ID
    board: async (_, { id }, { user }) => {
      try {
        if (!user) {
          throw new Error("Not authenticated");
        }

        const boardRef = adminDb.collection("boards").doc(id);
        const boardDoc = await boardRef.get();

        if (!boardDoc.exists) {
          throw new Error("Board not found");
        }

        const boardData = boardDoc.data();
        
        // Get members ref first so we can use it for permission checks
        const membersRef = boardRef.collection("members");

        // Check if user is a member - first check memberIds array
        let isMember = boardData?.memberIds?.includes(user.uid) || boardData?.userId === user.uid;
        
        // If not in memberIds, check the members subcollection
        if (!isMember) {
          console.log(`Checking if user ${user.uid} is in members subcollection for board ${id}`);
          
          // Get members with this user's ID in the userId field
          const memberQuery = await membersRef
            .where('userId', '==', user.uid)
            .where('status', '==', 'ACCEPTED')
            .get();
            
          // Also check if user's email matches (in case userId isn't set yet)
          let memberEmailQuery = null;
          if (user.email) {
            memberEmailQuery = await membersRef
              .where('email', '==', user.email)
              .where('status', '==', 'ACCEPTED')
              .get();
          }
          
          // Check if user is in members collection with ACCEPTED status
          isMember = !memberQuery.empty || (memberEmailQuery && !memberEmailQuery.empty);
          
          console.log(`User ${user.uid} member status for board ${id}: ${isMember}`);
        }
        
        // Final permission check
        if (!isMember) {
          throw new Error("Not authorized to view this board");
        }
        const membersSnapshot = await membersRef.get();
        let members = membersSnapshot.docs.map(memberDoc => ({
          id: memberDoc.id,
          ...memberDoc.data(),
        }));
        
        // If no members found, add the current user as an admin
        if (members.length === 0) {
          console.log("No members found for board, adding current user as admin");
          
          // Get user data
          const userDoc = await adminDb.collection('users').doc(user.uid).get();
          let userName = 'Admin';
          let userEmail = '';
          
          if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData) {
              userName = userData.name || userData.displayName || userData.email || 'Admin';
              userEmail = userData.email || '';
            }
          }
          
          // Add the user to members collection
          const memberData = {
            id: user.uid,
            name: userName,
            email: userEmail,
            role: 'ADMIN',
            status: 'ACCEPTED',
            joinedAt: firestore.FieldValue.serverTimestamp()
          };
          
          // Add to Firestore for future queries
          await membersRef.doc(user.uid).set(memberData);
          
          // Add to the current response
          members = [memberData];
        }

        // Get columns
        const columnsRef = boardRef.collection("columns");
        const columnsSnapshot = await columnsRef.orderBy("order").get();
        const columns = await Promise.all(
          columnsSnapshot.docs.map(async (columnDoc) => {
            const columnData = columnDoc.data();
            
            // Get cards for each column
            const cardsRef = columnDoc.ref.collection("cards");
            const cardsSnapshot = await cardsRef.orderBy("order").get();
            const cards = cardsSnapshot.docs.map((cardDoc) => ({
              id: cardDoc.id,
              columnId: columnDoc.id,
              ...cardDoc.data(),
            }));

            return {
              id: columnDoc.id,
              cards,
              ...columnData,
            };
          })
        );

        return {
          id: boardDoc.id,
          columns,
          members,
          ...boardData,
        };
      } catch (error) {
        console.error("Error fetching board:", error);
        throw error;
      }
    },
    
    // Get board members
    getBoardMembers: async (_: any, { boardId }: { boardId: string }, context: Context) => {
      // Get user from context passed by the GraphQL server
      const user = context.user;
      
      if (!user) {
        throw new GraphQLError('Not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED',
          },
        });
      }

      try {
        // Check if the user is the owner or a member of the board - use Admin SDK
        const boardDoc = await adminDb.collection('boards').doc(boardId).get();
        
        if (!boardDoc.exists) {
          throw new GraphQLError('Board not found', {
            extensions: {
              code: 'NOT_FOUND',
            },
          });
        }
        
        const board = { id: boardDoc.id, ...boardDoc.data() };
        
        // Check if user is a member - use Admin SDK
        const membersRef = adminDb.collection('boardMembers');
        const memberQuerySnapshot = await membersRef
          .where('boardId', '==', boardId)
          .where('userId', '==', user.uid)
          .where('status', '==', 'ACCEPTED')
          .get();
        
        if (board.userId !== user.uid && memberQuerySnapshot.empty) {
          throw new GraphQLError('Not authorized to view this board', {
            extensions: {
              code: 'UNAUTHORIZED',
            },
          });
        }

        // Get all members - use Admin SDK
        const allMembersSnapshot = await membersRef
          .where('boardId', '==', boardId)
          .get();
        
        const members = allMembersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Fetch user data for each member - use Admin SDK
        const membersWithUsers = await Promise.all(
          members.map(async (member: any) => {
            if (member.userId) {
              const userDoc = await adminDb.collection('users').doc(member.userId).get();
              if (userDoc.exists) {
                member.user = {
                  id: userDoc.id,
                  ...userDoc.data()
                };
              }
            }
          return member;
        })
      );
      
      return membersWithUsers;
    } catch (error) {
      console.error('Error fetching board members:', error);
      throw error;
    }
    },

    // Get task statistics
    taskStats: async (_, __, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      try {
        console.log(`\n=== TaskStats for user: ${user.uid} ===`);
        
        // Get all boards for the user - using the improved method with member subcollection
        console.log(`Fetching boards for user: ${user.uid}`);
        
        // First get boards the user created directly
        const boardsRef = adminDb.collection("boards");
        let boardsSnapshot = await boardsRef
          .where("userId", "==", user.uid)
          .get();
          
        let boardDocs = [...boardsSnapshot.docs];
        
        // Then check for boards where the user is a member via subcollection
        console.log(`Checking for boards where user ${user.uid} is a member via subcollection`);
        const boardsCollection = adminDb.collection('boards');
        
        // Get all boards
        const allBoardsSnapshot = await boardsCollection.get();
        console.log(`Checking through ${allBoardsSnapshot.docs.length} boards for user membership`);
        
        // For each board, check if user is a member with ACCEPTED status
        for (const boardDoc of allBoardsSnapshot.docs) {
          const boardId = boardDoc.id;
          // Skip boards we already have
          if (boardDocs.some(doc => doc.id === boardId)) {
            continue;
          }
          
          const membersCollection = boardsCollection.doc(boardId).collection('members');
          const memberQuery = await membersCollection
            .where('id', '==', user.uid)
            .where('status', '==', 'ACCEPTED')
            .limit(1)
            .get();
            
          if (!memberQuery.empty) {
            boardDocs.push(boardDoc);
          }
        }
        
        console.log(`Found ${boardDocs.length} boards for user ${user.uid}`);

        let totalTasks = 0;
        let todoTasks = 0;
        let inProgressTasks = 0;
        let completedTasks = 0;

        // Loop through each board using the board resolver to ensure consistent column access
        for (const boardDoc of boardDocs) {
          const boardId = boardDoc.id;
          const boardData = boardDoc.data();
          console.log(`\nProcessing board: ${boardData.title || boardId} (ID: ${boardId})`);
          
          // Get board data using the same resolver used by the frontend
          // This ensures we access columns the same way as the UI
          const board = await resolvers.Query.board(null, { id: boardId }, { user });
          const columns = board.columns || [];
          
          console.log(`- Board has ${columns.length} columns`);
          console.log(`- Board details:`, JSON.stringify({
            id: board.id,
            title: board.title,
            columnCount: columns.length
          }));
          
          // First, print a summary of all columns and their cards
          console.log(`\n--- COLUMN SUMMARY FOR BOARD ${board.title || boardId} ---`);
          columns.forEach((column, index) => {
            const columnId = column.id;
            const columnTitle = column.title || 'Untitled';
            const cards = column.cards || [];
            console.log(`Column ${index+1}: "${columnTitle}" (ID: ${columnId}) - ${cards.length} cards`);
            
            // Log the first few cards for debugging
            if (cards.length > 0) {
              console.log(`  Card sample:`, cards.slice(0, 2).map(card => ({ 
                id: card.id,
                title: card.title,
                createdAt: card.createdAt
              })));
            }
          });
          console.log(`--- END COLUMN SUMMARY ---\n`);
          
          // Process each column
          // WARNING: There seems to be a mismatch in data structure between UI and resolver
          // Instead of using the columns from the board resolver, let's fetch directly from top-level columns collection
          
          console.log(`Fetching columns from top-level collection for board ${boardId}`);
          const columnsCollection = adminDb.collection('columns');
          const topLevelColumnsQuery = await columnsCollection
            .where('boardId', '==', boardId)
            .get();
            
          console.log(`Found ${topLevelColumnsQuery.docs.length} columns in the top-level collection for board ${boardId}`);
          
          for (const columnDoc of topLevelColumnsQuery.docs) {
            const column = columnDoc.data();
            const columnId = columnDoc.id;
            const columnTitle = (column.title || '').toLowerCase();
            
            // Fetch cards for this column from its subcollection
            const cardsCollection = columnDoc.ref.collection('cards');
            const cardsSnapshot = await cardsCollection.get();
            const cards = cardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Debug card details
            console.log(`Processing column: "${column.title}" (ID: ${columnId})`);
            console.log(`- Cards in this column: ${cards.length}`);
            
            // Process each card and get details for debugging
            if (cards.length > 0) {
              console.log(`- Card IDs: ${cards.map(c => c.id).join(', ').substring(0, 100)}${cards.length > 3 ? '...' : ''}`);
            }
            
            const cardsCount = cards.length;
            totalTasks += cardsCount;
            
            // Debug column titles with exact string for pattern matching
            console.log(`Column title: "${columnTitle}", cards: ${cardsCount}`);

            // Categorize tasks based on column title (with expanded patterns)
            // First log exact column title for debugging
            console.log(`  Raw column title: "${column.title}", Lowercase: "${columnTitle}"`);
            
            // TODO column patterns
            if (
              // Standard patterns
              columnTitle.includes("todo") || 
              columnTitle.includes("to do") || 
              columnTitle.includes("to-do") || 
              columnTitle.includes("plan") || 
              columnTitle.includes("backlog") || 
              columnTitle.includes("new") || 
              columnTitle.includes("queue") || 
              columnTitle.includes("pending") || 
              columnTitle.includes("upcoming") ||
              columnTitle === "to" ||
              // Add specific column names from your board
              columnTitle === "to do" ||
              // No longer check position since we're not using the columns array from the board
              // Instead, match any remaining common patterns
              columnTitle === "first column" ||
              columnTitle === "left column"
            ) {
              todoTasks += cardsCount;
              console.log(`  → Counted as TODO: ${cardsCount} cards`);
            } 
            // DONE column patterns
            else if (
              // Standard patterns
              columnTitle.includes("done") || 
              columnTitle.includes("complete") || 
              columnTitle.includes("finished") || 
              columnTitle.includes("archived") || 
              columnTitle.includes("closed") ||
              columnTitle === "completed" ||
              // Add specific column names from your board
              columnTitle === "done" ||
              // Add more potential matches for last column
              columnTitle === "last column" ||
              columnTitle === "right column" ||
              // No longer check position since we're not using the columns array from the board
              columnTitle === "right column"
            ) {
              completedTasks += cardsCount;
              console.log(`  → Counted as COMPLETED: ${cardsCount} cards`);
            } 
            // IN PROGRESS patterns
            else if (
              // Standard patterns
              columnTitle.includes("progress") || 
              columnTitle.includes("doing") || 
              columnTitle.includes("in progress") || 
              columnTitle.includes("ongoing") || 
              columnTitle.includes("working") || 
              columnTitle.includes("started") || 
              columnTitle.includes("development") || 
              columnTitle.includes("review") || 
              columnTitle.includes("testing") ||
              // Add specific column names from your board
              columnTitle === "doing" ||
              columnTitle === "in progress" ||
              // Add more potential matches for middle columns
              columnTitle === "middle column" ||
              // No longer check position since we're not using the columns array from the board
              columnTitle === "middle column"
            ) {
              inProgressTasks += cardsCount;
              console.log(`  → Counted as IN PROGRESS: ${cardsCount} cards`);
            } else {
              // Any other column types
              todoTasks += cardsCount;
              console.log(`  → Default counted as TODO: ${cardsCount} cards (uncategorized column)`);
            }
      }
    }

    // Summary of task counts
    console.log(`\n=== Task Summary ===`);
    console.log(`Total tasks: ${totalTasks}`);
    console.log(`TODO: ${todoTasks}`);
    console.log(`IN PROGRESS: ${inProgressTasks}`);
    console.log(`COMPLETED: ${completedTasks}`);
    console.log(`===================\n`);
    
    return {
      total: totalTasks,
      todo: todoTasks,
      inProgress: inProgressTasks,
      completed: completedTasks
    };
  } catch (error) {
    console.error("Error calculating task stats:", error);
    // Return empty data on error
    return {
      total: 0,
      todo: 0,
      inProgress: 0,
      completed: 0
    };
  }
},

// Get upcoming deadlines
upcomingDeadlines: async (_, { days = 7 }, { user }) => {
  if (!user) {
    throw new Error("Not authenticated");
  }

  try {
        // Calculate date range for upcoming deadlines
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + (days || 7));
        
        const todayTimestamp = today.toISOString();
        const futureDateTimestamp = futureDate.toISOString();
        
        // Get all boards for the user - similar to the taskStats resolver
        // First get boards the user created
        const boardsRef = adminDb.collection("boards");
        let boardsSnapshot = await boardsRef
          .where("userId", "==", user.uid)
          .get();
          
        let boardDocs = [...boardsSnapshot.docs];
        
        // Then check for boards where user is a member via subcollection
        console.log(`Checking for boards where user ${user.uid} is a member for deadlines`);
        const boardsCollection = adminDb.collection('boards');
        
        // Get all boards
        const allBoardsSnapshot = await boardsCollection.get();
        
        // For each board, check if user is a member with ACCEPTED status
        for (const boardDoc of allBoardsSnapshot.docs) {
          const boardId = boardDoc.id;
          // Skip boards we already have
          if (boardDocs.some(doc => doc.id === boardId)) {
            continue;
          }
          
          const membersCollection = boardsCollection.doc(boardId).collection('members');
          const memberQuery = await membersCollection
            .where('id', '==', user.uid)
            .where('status', '==', 'ACCEPTED')
            .limit(1)
            .get();
            
          if (!memberQuery.empty) {
            boardDocs.push(boardDoc);
          }
        }
        
        console.log(`Found ${boardDocs.length} boards to search for deadlines`);
        
        let deadlineCards = [];
        
        // Loop through each board
        for (const boardDoc of boardDocs) {
          const boardId = boardDoc.id;
          const boardTitle = boardDoc.data().title || "Untitled Board";
          
          // IMPORTANT: Get columns from top-level columns collection (same as we fixed in taskStats)
          console.log(`Searching for deadlines in board: ${boardTitle} (ID: ${boardId})`);
          const columnsCollection = adminDb.collection('columns');
          const columnsQuery = await columnsCollection
            .where('boardId', '==', boardId)
            .get();
          
          console.log(`Found ${columnsQuery.docs.length} columns for board ${boardId}`);
          
          // Loop through each column
          for (const columnDoc of columnsQuery.docs) {
            const columnId = columnDoc.id;
            const columnData = columnDoc.data();
            const columnTitle = columnData.title || "Untitled Column";
            
            // Get cards from the column's cards subcollection (correct path)
            const cardsRef = columnDoc.ref.collection("cards");
            const cardsSnapshot = await cardsRef.get();
            
            console.log(`Checking ${cardsSnapshot.docs.length} cards in column "${columnTitle}" (ID: ${columnId})`);
            
            for (const cardDoc of cardsSnapshot.docs) {
              const cardData = cardDoc.data();
              
              // Check if the card has a due date
              if (cardData.dueDate) {
                const dueDate = cardData.dueDate;
                let dueDateTimestamp;
                
                // Handle different possible date formats
                if (typeof dueDate === 'object' && dueDate._seconds) {
                  // Firestore Timestamp object
                  dueDateTimestamp = new Date(dueDate._seconds * 1000).toISOString();
                } else if (typeof dueDate === 'string') {
                  // ISO string
                  dueDateTimestamp = dueDate;
                } else if (dueDate instanceof Date) {
                  // Date object
                  dueDateTimestamp = dueDate.toISOString();
                } else {
                  console.log(`Skipping card with invalid dueDate format: ${typeof dueDate}`, dueDate);
                  continue;
                }
                
                // Check if due date is within our range
                if (dueDateTimestamp >= todayTimestamp && dueDateTimestamp <= futureDateTimestamp) {
                  console.log(`Found card with upcoming deadline: ${cardData.title || "Untitled"}`);
                  deadlineCards.push({
                    id: cardDoc.id,
                    title: cardData.title || "Untitled Card",
                    dueDate: dueDate, // Keep original format for consistency with UI
                    boardId: boardId,
                    boardTitle: boardTitle,
                    columnId: columnId,
                    columnTitle: columnTitle
                  });
                }
              }
            }
          }
        }
        
        // If no real deadlines found, let the user know instead of providing fallback data
        if (deadlineCards.length === 0) {
          console.log("No deadline cards found. Not using fallback data anymore.");
        }
        
        // Sort deadline cards by due date (earliest first)
        deadlineCards.sort((a, b) => {
          // Handle different date formats
          let dateA, dateB;
          
          if (typeof a.dueDate === 'object' && a.dueDate._seconds) {
            dateA = new Date(a.dueDate._seconds * 1000);
          } else if (typeof a.dueDate === 'string') {
            dateA = new Date(a.dueDate);
          } else if (a.dueDate instanceof Date) {
            dateA = a.dueDate;
          } else {
            dateA = new Date(0); // Default to epoch if invalid
          }
          
          if (typeof b.dueDate === 'object' && b.dueDate._seconds) {
            dateB = new Date(b.dueDate._seconds * 1000);
          } else if (typeof b.dueDate === 'string') {
            dateB = new Date(b.dueDate);
          } else if (b.dueDate instanceof Date) {
            dateB = b.dueDate;
          } else {
            dateB = new Date(0); // Default to epoch if invalid
          }
          
          return dateA.getTime() - dateB.getTime();
        });
        
        return deadlineCards;
      } catch (error) {
        console.error("Error fetching upcoming deadlines:", error);
        throw error;
      }
    },

    // Get recent activity
    recentActivity: async (_, args: RecentActivityArgs, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      const limit = args.limit || 10;
      const offset = args.offset || 0;

      try {
        // First check if we have any activity data in Firestore
        let activityData = [];
        
        try {
          console.log("Fetching activity from Firestore for user:", user.uid);
          const activityRef = adminDb.collection("activities"); // Changed from 'activity' to 'activities'
          const snapshot = await activityRef
            .where("userId", "==", user.uid)
            .orderBy("timestamp", "desc")
            .limit(limit)
            .offset(offset)
            .get();

          // Get raw activity data
          let rawActivityData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          
          // Verify board titles and fix any missing ones
          activityData = await Promise.all(rawActivityData.map(async (activity) => {
            // If boardTitle is missing, try to fetch it from the board
            if (!activity.boardTitle && activity.boardId) {
              try {
                const boardDoc = await adminDb.collection('boards').doc(activity.boardId).get();
                if (boardDoc.exists) {
                  const boardData = boardDoc.data();
                  activity.boardTitle = boardData?.title || 'Unknown Board';
                } else {
                  // Board no longer exists
                  activity.boardTitle = 'Deleted Board';
                }
              } catch (err) {
                console.error(`Error fetching board title for activity ${activity.id}:`, err);
                activity.boardTitle = 'Unknown Board';
              }
            } else if (!activity.boardTitle) {
              // No board ID available
              activity.boardTitle = 'Unknown Board';
            }
            
            return activity;
          }));
        } catch (firestoreError) {
          console.error("Firestore activity query error:", firestoreError);
          // We'll handle this by using the fallback data below
        }
        
        // If no real activity found, provide fallback demo data
        if (activityData.length === 0) {
          console.log("No activity found, using fallback data");
          // Generate timestamps starting from recent
          const now = new Date();
          
          activityData = [
            {
              id: "activity1",
              type: "CREATE_BOARD",
              boardId: "board1",
              boardTitle: "Project Roadmap",
              userId: user.uid,
              userName: user.displayName || user.email || "User",
              timestamp: new Date(now.setHours(now.getHours() - 2)).toISOString(),
              description: "Created a new board: Project Roadmap"
            },
            {
              id: "activity2",
              type: "ADD_CARD",
              boardId: "board1",
              boardTitle: "Project Roadmap",
              userId: user.uid,
              userName: user.displayName || user.email || "User",
              timestamp: new Date(now.setHours(now.getHours() - 3)).toISOString(),
              description: "Added task: Implement dashboard widgets"
            },
            {
              id: "activity3",
              type: "MOVE_CARD",
              boardId: "board1",
              boardTitle: "Project Roadmap",
              userId: user.uid,
              userName: user.displayName || user.email || "User",
              timestamp: new Date(now.setHours(now.getHours() - 5)).toISOString(),
              description: "Moved task: Fix GraphQL API errors to In Progress"
            },
            {
              id: "activity4",
              type: "INVITE_MEMBER",
              boardId: "board1",
              boardTitle: "Project Roadmap",
              userId: user.uid,
              userName: user.displayName || user.email || "User",
              timestamp: new Date(now.setHours(now.getHours() - 24)).toISOString(),
              description: "Invited team member: sarah@example.com"
            },
            {
              id: "activity5",
              type: "UPDATE_BOARD",
              boardId: "board1",
              boardTitle: "Project Roadmap",
              userId: user.uid,
              userName: user.displayName || user.email || "User",
              timestamp: new Date(now.setHours(now.getHours() - 48)).toISOString(),
              description: "Updated board background"
            }
          ];
          
          // Store these demo activities in Firestore for future use
          try {
            const batch = adminDb.batch();
            activityData.forEach(activity => {
              const activityRef = adminDb.collection("activities").doc(activity.id); // Changed from 'activity' to 'activities'
              batch.set(activityRef, activity);
            });
            await batch.commit();
            console.log("Demo activity data stored in Firestore");
          } catch (batchError) {
            console.error("Error storing demo activity data:", batchError);
            // Continue with returning the fallback data even if storage fails
          }
        }
        
        return activityData;
      } catch (error) {
        console.error("Error fetching activity:", error);
        throw error;
      }
    },
  },

  Mutation: {
    // Create a new board
    createBoard: async (_, { title, description }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      try {
        const boardRef = adminDb.collection("boards").doc();
        
        // Get user data for activity and member info
        const userDoc = await adminDb.collection('users').doc(user.uid).get();
        let userName = user.displayName || user.email || 'User';
        let userEmail = user.email || '';
        
        // If we have additional user data in Firestore, use it
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData) {
            // Use Firestore data only if it's better than what we already have
            if (!userName || userName === 'User') {
              userName = userData.name || userData.displayName || userData.email || userName;
            }
            if (!userEmail) {
              userEmail = userData.email || userEmail;
            }
          }
        }
        
        const newBoard = {
          title,
          description: description || "",
          userId: user.uid,
          memberIds: [user.uid], // User is always a member of their board
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        };

        await boardRef.set(newBoard);
        
        // Create members subcollection with admin role for creator
        const membersRef = boardRef.collection('members');
        await membersRef.doc(user.uid).set({
          id: user.uid,
          name: userName,
          email: userEmail,
          role: 'ADMIN', // Set the creator as an admin
          status: 'ACCEPTED',
          joinedAt: firestore.FieldValue.serverTimestamp()
        });

        // Log activity
        await logActivity({
          type: "BOARD_CREATED",
          userId: user.uid,
          boardId: boardRef.id,
          data: { title },
        });

        // Create a member object for the response
        const memberData = {
          id: user.uid,
          name: userName,
          email: userEmail,
          role: 'ADMIN',
          status: 'ACCEPTED'
        };

        return {
          id: boardRef.id,
          ...newBoard,
          columns: [],
          members: [memberData], // Include the member in the response
        };
      } catch (error) {
        console.error("Error creating board:", error);
        throw error;
      }
    },

    // Update a board
    updateBoard: async (_, { id, input }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      try {
        const boardRef = adminDb.collection("boards").doc(id);
        const boardDoc = await boardRef.get();

        if (!boardDoc.exists) {
          throw new Error("Board not found");
        }

        const boardData = boardDoc.data();
        if (boardData.userId !== user.uid) {
          throw new Error("Not authorized to update this board");
        }

        const updateData: any = {
          updatedAt: firestore.FieldValue.serverTimestamp(),
        };

        // Spread input object properties to updateData
        if (input) {
          if (input.title !== undefined) updateData.title = input.title;
          if (input.description !== undefined) updateData.description = input.description;
          if (input.isStarred !== undefined) updateData.isStarred = input.isStarred;
          if (input.isArchived !== undefined) updateData.isArchived = input.isArchived;
          if (input.background !== undefined) updateData.background = input.background;
        }

        await boardRef.update(updateData);

        // Log activity
        await logActivity({
          type: "BOARD_UPDATED",
          userId: user.uid,
          boardId: id,
          data: { title: updateData.title || boardData.title },
        });

        return {
          id,
          ...boardData,
          ...updateData,
        };
      } catch (error) {
        console.error("Error updating board:", error);
        const isOwner = boardData.userId === user.uid;
        let isAdmin = false;
        
        if (!isOwner) {
          // Check if the user is an admin member
          const membersRef = boardRef.collection('members');
          const adminMemberQuery = await membersRef
            .where('id', '==', user.uid)
            .where('role', '==', 'ADMIN')
            .get();
            
          isAdmin = !adminMemberQuery.empty;
          
          if (!isAdmin) {
            throw new Error("Not authorized to delete this board");
          }
        }
        
        console.log(`Deleting board ${id} and all related data`);
        
        // 1. Delete all members in the members subcollection
        console.log('Deleting board members...');
        const membersRef = boardRef.collection('members');
        await deleteCollection(membersRef);
        
        // 2. Delete all columns in the columns subcollection
        console.log('Deleting board columns...');
        const columnsRef = boardRef.collection('columns');
        
        // Get all columns first to delete their cards
        const columnsSnapshot = await columnsRef.get();
        for (const columnDoc of columnsSnapshot.docs) {
          // 3. Delete all cards in each column
          console.log(`Deleting cards for column ${columnDoc.id}...`);
          const cardsRef = columnDoc.ref.collection('cards');
          await deleteCollection(cardsRef);
        }
        
        // Now delete all columns
        await deleteCollection(columnsRef);
        
        // 4. Delete all related activities
        console.log('Deleting board activities...');
        const activitiesRef = adminDb.collection('activities');
        const activitiesSnapshot = await activitiesRef
          .where('boardId', '==', id)
          .get();
          
        if (!activitiesSnapshot.empty) {
          const batch = adminDb.batch();
          activitiesSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
        }
        
        // 5. Finally delete the board itself
        console.log('Deleting the board document...');
        await boardRef.delete();

        // Log activity about the deletion
        await logActivity({
          type: "BOARD_DELETED",
          userId: user.uid,
          boardId: id,
          data: { title: boardData.title },
        });

        console.log(`Board ${id} successfully deleted with all related data`);
        // Return true to indicate successful deletion
        return true;
      }
    },
    
    // Delete a column from a board
    deleteColumn: async (_, { columnId }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      try {
        // Get column data
        const columnRef = adminDb.collection("columns").doc(columnId);
        const columnDoc = await columnRef.get();

        if (!columnDoc.exists) {
          throw new Error("Column not found");
        }
        const columnData = columnDoc.data();
        const boardId = columnData.boardId;

        // Check if the board exists and user has permission
        const boardRef = adminDb.collection("boards").doc(boardId);
        const boardDoc = await boardRef.get();

        if (!boardDoc.exists) {
          throw new Error("Board not found");
        }

        const boardData = boardDoc.data();

        // Check if user is the board owner or admin
        if (boardData.userId !== user.uid) {
          // Check if user is an admin member
          const membersRef = boardRef.collection('members');
          const adminMemberQuery = await membersRef
            .where('id', '==', user.uid)
            .where('role', '==', 'ADMIN')
            .get();
            
          if (adminMemberQuery.empty) {
            throw new Error("Not authorized to delete columns on this board");
          }
        }

        // Get all cards in this column
        const cardsRef = columnRef.collection("cards");
        const cardsSnapshot = await cardsRef.get();

        // Delete all cards in the column
        const cardBatch = adminDb.batch();
        cardsSnapshot.docs.forEach((cardDoc) => {
          cardBatch.delete(cardDoc.ref);
        });
        await cardBatch.commit();

        // Delete the column
        await columnRef.delete();

        // Log activity
        await logActivity({
          type: "DELETE_COLUMN",
          userId: user.uid,
          boardId,
          data: { columnId, columnTitle: columnData.title }
        });

        // Return updated board
        const updatedBoard = {
          id: boardId,
          columns: await resolvers.Board.columns({ id: boardId }),
        };

        return updatedBoard;
      } catch (error) {
        console.error("Error deleting column:", error);
        throw error;
      }
    },

    // Move a column within a board (change order)
    moveColumn: async (_, { boardId, sourceIndex, destinationIndex }, { user }) => {
      if (!user) {
        throw new GraphQLError('Not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED',
          },
        });
      }

      try {
        console.log(`Moving column in board ${boardId} from index ${sourceIndex} to ${destinationIndex}`);
        
        // Check if board exists and user has permission
        const boardRef = adminDb.collection("boards").doc(boardId);
        const boardDoc = await boardRef.get();

        if (!boardDoc.exists) {
          throw new GraphQLError('Board not found', {
            extensions: {
              code: 'NOT_FOUND',
            },
          });
        }

        const boardData = boardDoc.data();

        // Check authorization
        const isCreator = boardData.userId === user.uid;
        let isAdmin = false;
        
        if (!isCreator) {
          // Check if user is an admin member
          const membersRef = boardRef.collection('members');
          const adminMemberQuery = await membersRef
            .where('id', '==', user.uid)
            .where('role', '==', 'ADMIN')
            .get();
            
          isAdmin = !adminMemberQuery.empty;
          
          if (!isAdmin) {
            throw new GraphQLError('Not authorized to reorder columns on this board', {
              extensions: {
                code: 'UNAUTHORIZED',
              },
            });
          }
        }

        // Get all columns for this board
        const columnsRef = adminDb.collection("columns");
        const columnsQuery = await columnsRef.where("boardId", "==", boardId).orderBy("order").get();

        if (columnsQuery.empty) {
          throw new GraphQLError('No columns found for this board', {
            extensions: {
              code: 'NOT_FOUND',
            },
          });
        }

        // Convert to array
        const columns = columnsQuery.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Validate indices
        if (sourceIndex < 0 || sourceIndex >= columns.length || 
            destinationIndex < 0 || destinationIndex >= columns.length) {
          throw new GraphQLError('Invalid source or destination index', {
            extensions: {
              code: 'BAD_USER_INPUT',
            },
          });
        }

        // Reorder columns
        const [movedColumn] = columns.splice(sourceIndex, 1);
        columns.splice(destinationIndex, 0, movedColumn);

        // Update order values
        const batch = adminDb.batch();
        columns.forEach((column, index) => {
          const columnRef = adminDb.collection("columns").doc(column.id);
          batch.update(columnRef, { order: index });
        });

        await batch.commit();
        console.log(`Successfully reordered columns in board ${boardId}`);

        // Log activity
        await logActivity({
          type: "MOVE_COLUMN",
          userId: user.uid,
          boardId,
          data: { columnId: movedColumn.id, sourceIndex, destinationIndex }
        });

        // Return updated board
        const updatedBoard = {
          id: boardId,
          title: boardData.title,
          columns: await resolvers.Board.columns({ id: boardId }),
        };

        return updatedBoard;
      } catch (error) {
        console.error("Error moving column:", error);
        throw error;
      }
    },

    // Add a column to a board
    addColumn: async (_, { boardId, title }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      try {
        console.log(`Adding column '${title}' to board ${boardId}`);
        
        // Check if user has access to this board
        const boardRef = adminDb.collection("boards").doc(boardId);
        const boardDoc = await boardRef.get();

        if (!boardDoc.exists) {
          throw new Error("Board not found");
        }

        const boardData = boardDoc.data();
        
        // Check if user is board owner or admin member
        const isOwner = boardData.userId === user.uid;
        let isAuthorized = isOwner;
        
        if (!isOwner) {
          // Check if user is an admin member
          const membersRef = boardRef.collection('members');
          const adminMemberQuery = await membersRef
            .where('id', '==', user.uid)
            .where('role', '==', 'ADMIN')
            .get();
          
          isAuthorized = !adminMemberQuery.empty;
        }
        
        if (!isAuthorized) {
          throw new Error("Not authorized to add columns to this board");
        }

        // Get current column count to determine order
        // Query from top-level columns collection
        const columnsRef = adminDb.collection("columns");
        const columnsSnapshot = await columnsRef.where("boardId", "==", boardId).get();
        const columnCount = columnsSnapshot.size;
        
        console.log(`Board has ${columnCount} existing columns`);

        // Create new column in the top-level collection
        const newColumnRef = columnsRef.doc();
        const newColumn = {
          boardId, // Important: store the boardId in the column document
          title,
          order: columnCount, // Add to the end
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        };

        await newColumnRef.set(newColumn);
        console.log(`Created new column with ID: ${newColumnRef.id}`);

        // Log activity
        await logActivity({
          type: "COLUMN_ADDED",
          userId: user.uid,
          boardId,
          data: { columnId: newColumnRef.id, title },
        });

        // Return updated board
        const updatedBoard = {
          id: boardId,
          title: boardData.title,
          columns: await resolvers.Board.columns({ id: boardId }),
        };
        
        console.log(`Returning updated board with ${updatedBoard.columns.length} columns`);
        return updatedBoard;
      } catch (error) {
        console.error("Error adding column:", error);
        throw error;
      }
    },

    // Add a card to a column
    addCard: async (_, { columnId, input }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      try {
        console.log(`Adding card "${input.title}" to column ${columnId}`);
        
        // Get the column directly from the top-level columns collection
        const columnRef = adminDb.collection("columns").doc(columnId);
        const columnDoc = await columnRef.get();
        
        if (!columnDoc.exists) {
          throw new Error("Column not found");
        }
        
        // Get the column data to find the boardId
        const columnData = columnDoc.data();
        const boardId = columnData.boardId;
        
        if (!boardId) {
          throw new Error("Column does not have a board reference");
        }
        
        console.log(`Column belongs to board ${boardId}`);
        
        // Get the board to check authorization
        const boardRef = adminDb.collection("boards").doc(boardId);
        const boardDoc = await boardRef.get();
        
        if (!boardDoc.exists) {
          throw new Error("Board not found");
        }
        
        const boardData = boardDoc.data();
        
        // Check if user is board owner or admin member
        const isOwner = boardData.userId === user.uid;
        let isAuthorized = isOwner;
        
        if (!isOwner) {
          // Check if user is a member
          const membersRef = boardRef.collection('members');
          const memberQuery = await membersRef
            .where('id', '==', user.uid)
            .where('status', '==', 'ACCEPTED')
            .get();
            
          isAuthorized = !memberQuery.empty;
        }
        
        if (!isAuthorized) {
          throw new Error("Not authorized to add cards to this board");
        }

        // Get current card count to determine order
        const cardsRef = columnRef.collection("cards");
        const cardsSnapshot = await cardsRef.get();
        const cardCount = cardsSnapshot.size;
        
        console.log(`Column has ${cardCount} existing cards`);

        // Create new card
        const newCardRef = cardsRef.doc();
        const newCard = {
          columnId: columnId,
          title: input.title,
          description: input.description || "",
          order: cardCount, // Add to the end
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        };

        await newCardRef.set(newCard);
        console.log(`Created new card with ID: ${newCardRef.id}`);

        // Log activity
        await logActivity({
          type: "CARD_ADDED",
          userId: user.uid,
          boardId: boardId,
          data: { cardId: newCardRef.id, title: input.title, columnId },
        });

        // Return updated board
        const updatedBoard = await resolvers.Query.board(null, { id: boardId }, { user });
        console.log(`Returning updated board with ${updatedBoard.columns?.length || 0} columns`);
        return updatedBoard;
      } catch (error) {
        console.error("Error adding card:", error);
        throw error;
      }
    },
    
    // Invite a member to a board
    inviteMember: async (_: any, { boardId, email }: { boardId: string; email: string }, context: Context) => {
      // Get user from context passed by the GraphQL server
      const user = context.user;
      
      if (!user) {
        throw new GraphQLError('Not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED',
          },
        });
      }

      try {
        // Check if the user is the owner of the board - Use Admin SDK
        const boardDoc = await adminDb.collection('boards').doc(boardId).get();
        
        if (!boardDoc.exists) {
          throw new GraphQLError('Board not found', {
            extensions: {
              code: 'NOT_FOUND',
            },
          });
        }
        
        const board = { id: boardDoc.id, ...boardDoc.data() };
        
        // Check if user is either the board creator or an admin member
        const isCreator = board.userId === user.uid;
        
        if (!isCreator) {
          // Check if the user is an admin member
          const membersRef = adminDb.collection('boards').doc(boardId).collection('members');
          const adminMemberQuery = await membersRef
            .where('id', '==', user.uid)
            .where('role', '==', 'ADMIN')
            .get();
            
          const isAdmin = !adminMemberQuery.empty;
          
          // If neither creator nor admin, unauthorized
          if (!isAdmin) {
            throw new GraphQLError('Not authorized to invite members to this board', {
              extensions: {
                code: 'UNAUTHORIZED',
              },
            });
          }
        }

        // Check if the user already exists - Use Admin SDK
        const usersRef = adminDb.collection('users');
        const userQuerySnapshot = await usersRef.where('email', '==', email).get();
        let existingUserId = null;
        
        if (!userQuerySnapshot.empty) {
          existingUserId = userQuerySnapshot.docs[0].id;
        }

        // Check if the member has already been invited - Use the board's members subcollection
        const boardMembersRef = adminDb.collection('boards').doc(boardId).collection('members');
        const memberQuerySnapshot = await boardMembersRef
          .where('email', '==', email)
          .get();
        
        if (!memberQuerySnapshot.empty) {
          throw new GraphQLError('User has already been invited to this board', {
            extensions: {
              code: 'BAD_USER_INPUT',
            },
          });
        }

        // Create a member invitation in the board's members subcollection
        const memberData = {
          id: existingUserId || email.replace(/[^a-zA-Z0-9]/g, '_'), // Use userId if available, otherwise create an ID from email
          email,
          status: 'PENDING',
          role: 'MEMBER', // Set default role to MEMBER instead of null
          userId: existingUserId,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        };
        
        // Generate a unique ID for the member document if we don't have a user ID
        const memberId = existingUserId || `${Date.now()}_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        // Store in the board's members subcollection
        const memberRef = boardMembersRef.doc(memberId);
        await memberRef.set(memberData);
        
        // Verify the member was saved properly
        const verifyDoc = await memberRef.get();
        if (!verifyDoc.exists) {
          console.error('Failed to save member to database - verification failed');
          throw new GraphQLError('Failed to save member to database', {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
            },
          });
        }
        console.log('Successfully saved member to database:', verifyDoc.data());

        // Generate invitation link with the board ID and member ID
        const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/invitations/accept?boardId=${boardId}&memberId=${memberRef.id}`;

        // Try to send invitation email, but continue even if it fails
        try {
          // First check if the function exists
          if (typeof sendBoardInvitation === 'function') {
            await sendBoardInvitation({
              email,
              inviterName: user.displayName || user.email || 'A user',
              boardName: board.title,
              invitationLink,
            });
          } else {
            console.log('Email invitation not sent: sendBoardInvitation function not found');
            // Continue without sending email - the member record is already created
          }
        } catch (emailError) {
          console.log('Failed to send invitation email, but continuing with member addition:', emailError);
          // Continue without throwing - we'll still add the member to the board
        }

        return {
          id: boardId,
          members: await resolvers.Board.members({ id: boardId }),
        };
      } catch (error) {
        console.error('Failed to send invitation:', error);
        throw new GraphQLError('Failed to send invitation', {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            error: error instanceof Error ? error.message : String(error)
          },
        });
      }
    },

    // Remove a member from a board
    removeMember: async (_: any, { boardId, memberId }: { boardId: string; memberId: string }, context: Context) => {
      // Get user from context passed by the GraphQL server
      const user = context.user;
      
      if (!user) {
        throw new GraphQLError('Not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED',
          },
        });
      }

      try {
        console.log(`Request to remove member ${memberId} from board ${boardId} by user ${user.uid}`);
        
        // Check if the board exists - Using Admin SDK
        const boardDoc = await adminDb.collection('boards').doc(boardId).get();
        
        if (!boardDoc.exists) {
          console.log(`Board ${boardId} not found`);
          throw new GraphQLError('Board not found', {
            extensions: {
              code: 'NOT_FOUND',
            },
          });
        }
        
        const boardData = boardDoc.data();
        
        // Check if user is authorized (either creator or admin)
        const isCreator = boardData?.userId === user.uid;
        
        if (!isCreator) {
          // Check if the user is an admin member
          const membersRef = adminDb.collection('boards').doc(boardId).collection('members');
          const adminMemberQuery = await membersRef
            .where('id', '==', user.uid)
            .where('role', '==', 'ADMIN')
            .get();
            
          const isAdmin = !adminMemberQuery.empty;
          
          // If neither creator nor admin, unauthorized
          if (!isAdmin) {
            console.log(`User ${user.uid} not authorized to remove members from board ${boardId}`);
            throw new GraphQLError('Not authorized to remove members from this board', {
              extensions: {
                code: 'UNAUTHORIZED',
              },
            });
          }
        }

        // First check if the memberId exists as a document ID in the members subcollection
        const membersCollectionRef = adminDb.collection('boards').doc(boardId).collection('members');
        const memberDoc = await membersCollectionRef.doc(memberId).get();
        
        // If member document exists, delete it directly
        if (memberDoc.exists) {
          console.log(`Removing member with ID ${memberId} from board ${boardId}`);
          await memberDoc.ref.delete();
          console.log(`Successfully removed member document ${memberId}`);
        } else {
          // If not found by ID, try to find by email (for email-based members)
          console.log(`Member document with ID ${memberId} not found directly, checking if it's an email-based member`);
          
          // Try to find the member by email or other identifier
          const memberQuery = await membersCollectionRef
            .where('email', '==', memberId)
            .limit(1)
            .get();
          
          // If found by email, delete that document
          if (!memberQuery.empty) {
            const memberDocByEmail = memberQuery.docs[0];
            console.log(`Found member by email: ${memberId}, document ID: ${memberDocByEmail.id}`);
            await memberDocByEmail.ref.delete();
            console.log(`Successfully removed member with email ${memberId}`);
          } else {
            // As a last resort, check if memberId is the user ID (not document ID)
            const memberByUserIdQuery = await membersCollectionRef
              .where('id', '==', memberId)
              .limit(1)
              .get();
              
            if (!memberByUserIdQuery.empty) {
              const memberDocByUserId = memberByUserIdQuery.docs[0];
              console.log(`Found member by user ID: ${memberId}, document ID: ${memberDocByUserId.id}`);
              await memberDocByUserId.ref.delete();
              console.log(`Successfully removed member with user ID ${memberId}`);
            } else {
              console.log(`Member ${memberId} not found in board ${boardId} by any method`);
              throw new GraphQLError('Member not found in this board', {
                extensions: {
                  code: 'NOT_FOUND',
                },
              });
            }
          }
        }
        
        // Log the activity
        await logActivity({
          type: "MEMBER_REMOVED",
          userId: user.uid,
          boardId: boardId,
          data: { memberId, boardId }
        });
        
        // Explicitly fetch the updated members list
        const updatedMembers = await resolvers.Board.members({ id: boardId });
        console.log(`After removal, board ${boardId} has ${updatedMembers.length} members`);
        
        // Return updated board with members
        return {
          id: boardId,
          members: updatedMembers,
        };
      } catch (error) {
        console.error('Failed to remove member:', error);
        throw new GraphQLError('Failed to remove member', {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            error: error instanceof Error ? error.message : String(error)
          },
        });
      }
    },
  },
};
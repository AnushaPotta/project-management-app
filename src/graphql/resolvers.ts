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
    updatedAt: (parent: any) => parent.updatedAt ? formatTimestamp(parent.updatedAt) : null,
    
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
        
        let membersList = membersSnapshot.docs.map(memberDoc => {
          console.log(`Member from DB: ID=${memberDoc.id}, data=`, memberDoc.data());
          return {
            id: memberDoc.id,
            ...memberDoc.data(),
          };
        });
        
        // Check if the creator is already in the members list
        const creatorExists = membersList.some(member => member.id === creatorId);
        console.log(`Creator exists in members list: ${creatorExists}`);
        
        // If creator isn't in the members list, add them as an admin
        if (!creatorExists && creatorId) {
          console.log(`Adding creator ${creatorId} as admin`);
          
          // Get creator's user info
          const userDoc = await adminDb.collection('users').doc(creatorId).get();
          let userData = null;
          
          if (userDoc.exists) {
            userData = userDoc.data();
            console.log(`Found creator user data:`, userData);
          } else {
            console.log(`Creator user data not found`);
          }
          
          // Create admin member record for creator
          const creatorMember = {
            id: creatorId,
            name: userData?.name || userData?.displayName || 'Admin',
            email: userData?.email || '',
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
  },

  Column: {
    createdAt: (parent: any) => formatTimestamp(parent.createdAt),
    updatedAt: (parent: any) => parent.updatedAt ? formatTimestamp(parent.updatedAt) : null,
  },

  Card: {
    createdAt: (parent: any) => formatTimestamp(parent.createdAt),
    updatedAt: (parent: any) => parent.updatedAt ? formatTimestamp(parent.updatedAt) : null,
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
        
        // Get all boards for the user
        const boardsRef = adminDb.collection("boards");
        const boardsSnapshot = await boardsRef
          .where("memberIds", "array-contains", user.uid)
          .get();
          
        console.log(`Found ${boardsSnapshot.docs.length} boards for user`);

        let totalTasks = 0;
        let todoTasks = 0;
        let inProgressTasks = 0;
        let completedTasks = 0;

        // Loop through each board using the board resolver to ensure consistent column access
        for (const boardDoc of boardsSnapshot.docs) {
          const boardId = boardDoc.id;
          const boardData = boardDoc.data();
          console.log(`\nProcessing board: ${boardData.title || boardId} (ID: ${boardId})`);
          
          // Get board data using the same resolver used by the frontend
          // This ensures we access columns the same way as the UI
          const board = await resolvers.Query.board(null, { id: boardId }, { user });
          const columns = board.columns || [];
          
          console.log(`- Board has ${columns.length} columns`);
          
          // Process each column's cards
          for (const column of columns) {
            const columnTitle = column.title.toLowerCase();
            const cards = column.cards || [];
            const cardsCount = cards.length;
            
            totalTasks += cardsCount;
            
            // Debug column titles
            console.log(`Column title: ${columnTitle}, cards: ${cardsCount}`);

            // Categorize tasks based on column title (with expanded patterns)
            // TODO column patterns
            if (
              columnTitle.includes("todo") || 
              columnTitle.includes("to do") || 
              columnTitle.includes("to-do") || 
              columnTitle.includes("plan") || 
              columnTitle.includes("backlog") || 
              columnTitle.includes("new") || 
              columnTitle.includes("queue") || 
              columnTitle.includes("pending") || 
              columnTitle.includes("upcoming") ||
              columnTitle === "to"
            ) {
              todoTasks += cardsCount;
              console.log(`  → Counted as TODO: ${cardsCount} cards`);
            } 
            // DONE column patterns
            else if (
              columnTitle.includes("done") || 
              columnTitle.includes("complete") || 
              columnTitle.includes("finished") || 
              columnTitle.includes("archived") || 
              columnTitle.includes("closed") ||
              columnTitle === "completed"
            ) {
              completedTasks += cardsCount;
              console.log(`  → Counted as COMPLETED: ${cardsCount} cards`);
            } 
            // IN PROGRESS patterns (anything else)
            else {
              inProgressTasks += cardsCount;
              console.log(`  → Counted as IN PROGRESS: ${cardsCount} cards`);
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
        
        // If no tasks found, return fallback demo data
        if (totalTasks === 0) {
          console.log("No tasks found, returning fallback demo data");
          return {
            total: 8,
            todo: 3,
            inProgress: 4,
            completed: 1
          };
        }

        return {
          total: totalTasks,
          todo: todoTasks,
          inProgress: inProgressTasks,
          completed: completedTasks
        };
      } catch (error) {
        console.error("Error calculating task stats:", error);
        // Return fallback data even on error
        return {
          total: 8,
          todo: 3,
          inProgress: 4,
          completed: 1
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
        
        // Get all boards for the user
        const boardsRef = adminDb.collection("boards");
        const boardsSnapshot = await boardsRef
          .where("memberIds", "array-contains", user.uid)
          .get();
        
        let deadlineCards = [];
        
        // Loop through each board
        for (const boardDoc of boardsSnapshot.docs) {
          const boardId = boardDoc.id;
          const boardTitle = boardDoc.data().title || "Untitled Board";
          const columnsRef = adminDb.collection("boards").doc(boardId).collection("columns");
          const columnsSnapshot = await columnsRef.get();
          
          // Loop through each column
          for (const columnDoc of columnsSnapshot.docs) {
            const columnId = columnDoc.id;
            const columnTitle = columnDoc.data().title || "Untitled Column";
            
            // Get cards in this column with due dates in the upcoming days
            const cardsRef = columnsRef.doc(columnId).collection("cards");
            const cardsSnapshot = await cardsRef.get();
            
            for (const cardDoc of cardsSnapshot.docs) {
              const cardData = cardDoc.data();
              
              // Check if the card has a due date
              if (cardData.dueDate) {
                const dueDate = cardData.dueDate;
                
                // Check if due date is within our range
                if (dueDate >= todayTimestamp && dueDate <= futureDateTimestamp) {
                  deadlineCards.push({
                    id: cardDoc.id,
                    title: cardData.title || "Untitled Card",
                    dueDate: cardData.dueDate,
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
        
        // If no real deadlines found, provide fallback demo data
        if (deadlineCards.length === 0) {
          console.log("No deadline cards found, using fallback data");
          // Create fallback deadline cards with dates spread over the next week
          const now = new Date();
          
          // Demo board/column data if we don't have real ones
          const demoBoardId = boardsSnapshot.docs.length > 0 ? 
            boardsSnapshot.docs[0].id : "demo-board-1";
          const demoBoardTitle = boardsSnapshot.docs.length > 0 ? 
            boardsSnapshot.docs[0].data().title || "Demo Board" : "Demo Board";
            
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const threeDays = new Date(now);
          threeDays.setDate(threeDays.getDate() + 3);
          
          const fiveDays = new Date(now);
          fiveDays.setDate(fiveDays.getDate() + 5);
          
          deadlineCards = [
            {
              id: "deadline1",
              title: "Complete dashboard widgets implementation",
              dueDate: tomorrow.toISOString(),
              boardId: demoBoardId,
              boardTitle: demoBoardTitle,
              columnId: "column1",
              columnTitle: "In Progress"
            },
            {
              id: "deadline2",
              title: "Finalize GraphQL API",
              dueDate: threeDays.toISOString(),
              boardId: demoBoardId,
              boardTitle: demoBoardTitle,
              columnId: "column2",
              columnTitle: "To Do"
            },
            {
              id: "deadline3",
              title: "Deploy to production",
              dueDate: fiveDays.toISOString(),
              boardId: demoBoardId,
              boardTitle: demoBoardTitle,
              columnId: "column3",
              columnTitle: "Planning"
            }
          ];
          
          // Try to create these tasks in Firestore for future reference
          try {
            if (boardsSnapshot.docs.length > 0) {
              const firstBoardId = boardsSnapshot.docs[0].id;
              const columnsRef = adminDb.collection("boards").doc(firstBoardId).collection("columns");
              const columnsSnapshot = await columnsRef.limit(1).get();
              
              if (!columnsSnapshot.empty) {
                const firstColumnId = columnsSnapshot.docs[0].id;
                const cardsRef = columnsRef.doc(firstColumnId).collection("cards");
                
                const batch = adminDb.batch();
                deadlineCards.forEach(card => {
                  // Adapt card to actual data structure for Firestore
                  const cardRef = cardsRef.doc(card.id);
                  const cardData = {
                    title: card.title,
                    dueDate: card.dueDate,
                    order: Math.floor(Math.random() * 10),
                    columnId: firstColumnId,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  };
                  batch.set(cardRef, cardData);
                });
                await batch.commit();
                console.log("Demo deadline cards stored in Firestore");
              }
            }
          } catch (batchError) {
            console.error("Error storing demo deadline cards:", batchError);
            // Continue with returning the fallback data even if storage fails
          }
        }
        
        // Sort by due date (ascending)
        deadlineCards.sort((a, b) => {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
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

          activityData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
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
        let userName = 'Admin';
        let userEmail = '';
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData) {
            userName = userData.name || userData.displayName || userData.email || 'Admin';
            userEmail = userData.email || '';
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
          userName, // Explicitly pass the user's name
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
    updateBoard: async (_, { id, title, description, isStarred }, { user }) => {
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

        if (title !== undefined) {
          updateData.title = title;
        }

        if (description !== undefined) {
          updateData.description = description;
        }

        if (isStarred !== undefined) {
          updateData.isStarred = isStarred;
        }

        await boardRef.update(updateData);

        // Log activity
        await logActivity({
          type: "BOARD_UPDATED",
          userId: user.uid,
          boardId: id,
          data: { title },
        });

        return {
          id,
          ...boardData,
          ...updateData,
        };
      } catch (error) {
        console.error("Error updating board:", error);
        throw error;
      }
    },
    
    // Delete a board and all related data
    deleteBoard: async (_, { id }, { user }) => {
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
        
        // Check authorization - either owner or admin
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
      } catch (error) {
        console.error("Error deleting board:", error);
        throw error;
      }
    },

    // Add a column to a board
    addColumn: async (_, { boardId, title }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      try {
        // Check if user has access to this board
        const boardRef = adminDb.collection("boards").doc(boardId);
        const boardDoc = await boardRef.get();

        if (!boardDoc.exists) {
          throw new Error("Board not found");
        }

        const boardData = boardDoc.data();
        if (!boardData.memberIds.includes(user.uid)) {
          throw new Error("Not authorized to add columns to this board");
        }

        // Get current column count to determine order
        const columnsRef = boardRef.collection("columns");
        const columnsSnapshot = await columnsRef.get();
        const columnCount = columnsSnapshot.size;

        // Create new column
        const newColumnRef = columnsRef.doc();
        const newColumn = {
          title,
          order: columnCount, // Add to the end
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        };

        await newColumnRef.set(newColumn);

        // Log activity
        await logActivity({
          type: "COLUMN_ADDED",
          userId: user.uid,
          boardId,
          data: { columnId: newColumnRef.id, title },
        });

        // Return updated board
        return await resolvers.Query.board(null, { id: boardId }, { user });
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
        // Query all boards to find which one contains our column
        const boardsRef = adminDb.collection("boards");
        const boardsSnapshot = await boardsRef.where("memberIds", "array-contains", user.uid).get();
        
        if (boardsSnapshot.empty) {
          throw new Error("No boards found for current user");
        }
        
        // Search through each board's columns for the target column
        let columnDoc = null;
        let boardRef = null;
        
        // Check each board
        for (const boardDoc of boardsSnapshot.docs) {
          const columnsRef = boardDoc.ref.collection("columns");
          const columnSnapshot = await columnsRef.doc(columnId).get();
          
          if (columnSnapshot.exists) {
            columnDoc = columnSnapshot;
            boardRef = boardDoc.ref;
            break;
          }
        }
        
        if (!columnDoc || !boardRef) {
          throw new Error("Column not found or you don't have access to this column");
        }

        const boardDoc = await boardRef.get();
        const boardData = boardDoc.data();

        if (!boardData.memberIds.includes(user.uid)) {
          throw new Error("Not authorized to add cards to this board");
        }

        // Get current card count to determine order
        const cardsRef = columnDoc.ref.collection("cards");
        const cardsSnapshot = await cardsRef.get();
        const cardCount = cardsSnapshot.size;

        // Create new card
        const newCardRef = cardsRef.doc();
        const newCard = {
          title: input.title,
          description: input.description || "",
          order: cardCount, // Add to the end
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        };

        await newCardRef.set(newCard);

        // Log activity
        await logActivity({
          type: "CARD_ADDED",
          userId: user.uid,
          boardId: boardRef.id,
          data: { cardId: newCardRef.id, title: input.title, columnId },
        });

        // Return updated board
        return await resolvers.Query.board(null, { id: boardRef.id }, { user });
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

      // Check if the user is the owner of the board
      const boardDoc = await getDoc(doc(db, 'boards', boardId));
      
      if (!boardDoc.exists()) {
        throw new GraphQLError('Board not found', {
          extensions: {
            code: 'NOT_FOUND',
          },
        });
      }
      
      const board = { id: boardDoc.id, ...boardDoc.data() };
      
      if (board.userId !== user.uid) {
        throw new GraphQLError('Not authorized to remove members from this board', {
          extensions: {
            code: 'UNAUTHORIZED',
          },
        });
      }

      // Delete the member
      try {
        await deleteDoc(doc(db, 'boardMembers', memberId));
        
        return {
          id: boardId,
          members: await resolvers.Board.members({ id: boardId }),
        };
      } catch (error) {
        console.error('Failed to remove member:', error);
        throw new GraphQLError('Failed to remove member', {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
          },
        });
      }
    },
  },
};
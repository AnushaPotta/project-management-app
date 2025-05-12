// src/graphql/resolvers/userProfile.ts
import admin from "firebase-admin";
import { GraphQLError } from "graphql";
import { firestore } from "firebase-admin";

// Admin Firestore instance for server-side operations
const adminDb = admin.firestore();

export const userProfileResolver = async (_, __, { user }) => {
  if (!user) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  
  try {
    console.log(`Fetching user profile for: ${user.uid}`);
    
    // Get user data from Firestore
    const userDoc = await adminDb.collection('users').doc(user.uid).get();
    let userData = {
      id: user.uid,
      name: user.displayName || '',
      email: user.email || '',
      avatar: user.photoURL || '',
    };
    
    // If user exists in Firestore, enhance the profile with that data
    if (userDoc.exists) {
      const firestoreData = userDoc.data();
      console.log('Found Firestore user data:', firestoreData);
      
      if (firestoreData) {
        // Prioritize Firestore data over auth data if available
        userData.name = firestoreData.name || firestoreData.displayName || userData.name;
        userData.email = firestoreData.email || userData.email;
        userData.avatar = firestoreData.photoURL || firestoreData.avatar || userData.avatar;
      }
    } else {
      console.log(`No Firestore document found for user ${user.uid}, creating one`);
      
      // Create a new user document if it doesn't exist
      await adminDb.collection('users').doc(user.uid).set({
        name: userData.name,
        email: userData.email,
        photoURL: userData.avatar,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    }
    
    console.log('Returning user profile:', userData);
    return userData;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new GraphQLError('Failed to fetch user profile', {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }
};

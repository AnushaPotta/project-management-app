// src/lib/firebase-admin.ts
import * as admin from "firebase-admin";

// Check if Firebase admin app has already been initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

adminDb
  .collection("test")
  .doc("connection-test")
  .set({
    timestamp: Date.now(),
  })
  .then(() => {
    console.log("Firestore connection verified successfully");
  })
  .catch((error) => {
    console.error("Firestore connection error:", error);
  });

export { admin, adminAuth, adminDb };

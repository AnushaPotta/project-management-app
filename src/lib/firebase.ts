// lib/firebase.ts
"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  User,
  sendEmailVerification as firebaseSendEmailVerification,
  deleteUser,
  updatePassword as firebaseUpdatePassword,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjYoWj8W2SwK-SyospXCIL84Q73jJ50Nk",
  authDomain: "project-management-tool-dd30e.firebaseapp.com",
  projectId: "project-management-tool-dd30e",
  storageBucket: "project-management-tool-dd30e.firebasestorage.app",
  messagingSenderId: "550432902598",
  appId: "1:550432902598:web:2936824abe9c717cef76c7",
  measurementId: "G-GS43SM23TS",
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Authentication helper functions
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

const loginWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error logging in with email and password:", error);
    throw error;
  }
};

const registerWithEmailAndPassword = async (
  email: string,
  password: string,
  displayName: string
) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Update the user's profile with the display name
    await updateProfile(user, { displayName });

    // Send email verification
    await sendEmailVerification(user);

    return user;
  } catch (error) {
    console.error("Error registering with email and password:", error);
    throw error;
  }
};

const sendPasswordReset = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

const updateUserProfile = async (
  user: User,
  profile: { displayName?: string; photoURL?: string }
) => {
  try {
    await updateProfile(user, profile);
    return user;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

const sendEmailVerification = async (user: User) => {
  try {
    await firebaseSendEmailVerification(user);
  } catch (error) {
    console.error("Error sending email verification:", error);
    throw error;
  }
};

const deleteUserAccount = async (user: User) => {
  try {
    await deleteUser(user);
  } catch (error) {
    console.error("Error deleting user account:", error);
    throw error;
  }
};

const updateUserPassword = async (user: User, newPassword: string) => {
  try {
    await firebaseUpdatePassword(user, newPassword);
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
};

export {
  auth,
  db,
  storage,
  signInWithGoogle,
  loginWithEmailAndPassword,
  registerWithEmailAndPassword,
  sendPasswordReset,
  logout,
  updateUserProfile,
  sendEmailVerification,
  deleteUserAccount,
  updateUserPassword,
};

// src/contexts/auth-context.tsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  deleteUser,
  updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged,
  // FirebaseError is not exported from firebase/auth
} from "firebase/auth";
import { FirebaseError } from "firebase/app"; // Import FirebaseError from firebase/app
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
  updatePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (data: {
    displayName?: string;
    photoURL?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues by tracking client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run auth state listener on the client
    if (mounted) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [mounted]);

  const register = async (email: string, password: string, name: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await firebaseUpdateProfile(user, { displayName: name });

      // Send verification email
      await sendEmailVerification(user);

      setUser(user);
    } catch (error: unknown) {
      // Explicitly type as unknown
      if (error instanceof FirebaseError) {
        // Rethrow with more context
        throw new Error(`Registration failed: ${error.message}`);
      }
      // For non-Firebase errors
      throw new Error(
        `Registration failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      setUser(user);
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        // Provide more user-friendly error messages
        if (
          error.code === "auth/user-not-found" ||
          error.code === "auth/wrong-password"
        ) {
          throw new Error("Invalid email or password");
        }
        throw new Error(`Login failed: ${error.message}`);
      }
      throw new Error(
        `Login failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      setUser(user);
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        // Handle popup closed by user
        if (error.code === "auth/popup-closed-by-user") {
          throw new Error("Sign in was cancelled");
        }
        throw new Error(`Google sign in failed: ${error.message}`);
      }
      throw new Error(
        `Google sign in failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error: unknown) {
      console.error("Error signing out:", error);
      throw new Error(
        `Failed to sign out: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        if (error.code === "auth/user-not-found") {
          throw new Error("No account found with this email");
        }
        throw new Error(`Password reset failed: ${error.message}`);
      }
      throw new Error(
        `Password reset failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const verifyEmail = async () => {
    if (!user) throw new Error("No user logged in");
    try {
      await sendEmailVerification(user);
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        throw new Error(`Email verification failed: ${error.message}`);
      }
      throw new Error(
        `Email verification failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (!user || !user.email) throw new Error("No user logged in");

    try {
      // Re-authenticate user before updating password
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await firebaseUpdatePassword(user, newPassword);
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        if (error.code === "auth/wrong-password") {
          throw new Error("Current password is incorrect");
        }
        throw new Error(`Password update failed: ${error.message}`);
      }
      throw new Error(
        `Password update failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const deleteAccount = async () => {
    if (!user) throw new Error("No user logged in");
    try {
      await deleteUser(user);
      setUser(null);
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        if (error.code === "auth/requires-recent-login") {
          throw new Error("Please log in again before deleting your account");
        }
        throw new Error(`Account deletion failed: ${error.message}`);
      }
      throw new Error(
        `Account deletion failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const updateProfile = async (data: {
    displayName?: string;
    photoURL?: string;
  }) => {
    if (!user) throw new Error("No user logged in");
    try {
      await firebaseUpdateProfile(user, data);
      
      // Instead of creating a new user object with spread operator (which loses methods),
      // use the current user from auth which preserves all methods
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        throw new Error(`Profile update failed: ${error.message}`);
      }
      throw new Error(
        `Profile update failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    register,
    login,
    signInWithGoogle,
    signOut,
    resetPassword,
    verifyEmail,
    updatePassword,
    deleteAccount,
    updateProfile,
  };

  // Prevent hydration errors by not rendering children until client-side
  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

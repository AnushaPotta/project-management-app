// contexts/auth-context.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  auth,
  signInWithGoogle,
  loginWithEmailAndPassword,
  registerWithEmailAndPassword,
  sendPasswordReset,
  logout,
  updateUserProfile,
  sendEmailVerification,
  deleteUserAccount,
  updateUserPassword,
} from "@/lib/firebase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: {
    displayName?: string;
    photoURL?: string;
  }) => Promise<User | null>;
  verifyEmail: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updatePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {
    throw new Error("Not implemented");
  },
  login: async () => {
    throw new Error("Not implemented");
  },
  register: async () => {
    throw new Error("Not implemented");
  },
  resetPassword: async () => {
    throw new Error("Not implemented");
  },
  logout: async () => {
    throw new Error("Not implemented");
  },
  updateProfile: async () => {
    throw new Error("Not implemented");
  },
  verifyEmail: async () => {
    throw new Error("Not implemented");
  },
  deleteAccount: async () => {
    throw new Error("Not implemented");
  },
  updatePassword: async () => {
    throw new Error("Not implemented");
  },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    return loginWithEmailAndPassword(email, password);
  };

  const register = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    return registerWithEmailAndPassword(email, password, displayName);
  };

  const resetPassword = async (email: string) => {
    return sendPasswordReset(email);
  };

  const updateProfileData = async (profile: {
    displayName?: string;
    photoURL?: string;
  }) => {
    if (!user) return null;
    return updateUserProfile(user, profile);
  };

  const verifyEmail = async () => {
    if (!user) throw new Error("No user logged in");
    return sendEmailVerification(user);
  };

  const deleteAccount = async () => {
    if (!user) throw new Error("No user logged in");
    return deleteUserAccount(user);
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (!user || !user.email) throw new Error("No user logged in or no email");

    // First re-authenticate the user
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);

    // Then update the password
    return updateUserPassword(user, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        login,
        register,
        resetPassword,
        logout,
        updateProfile: updateProfileData,
        verifyEmail,
        deleteAccount,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

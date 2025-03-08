"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import {
  auth,
  signInWithGoogle,
  loginWithEmailAndPassword,
  registerWithEmailAndPassword,
  sendPasswordReset,
  logout,
  updateUserProfile,
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        login,
        register,
        resetPassword: resetPassword,
        logout,
        updateProfile: updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

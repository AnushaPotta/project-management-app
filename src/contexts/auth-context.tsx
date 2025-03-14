// src/contexts/auth-context.tsx
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
} from "firebase/auth";
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (email: string, password: string, name: string) => {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await firebaseUpdateProfile(user, { displayName: name });
    setUser(user);
  };

  const login = async (email: string, password: string) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    setUser(user);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const { user } = await signInWithPopup(auth, provider);
    setUser(user);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const verifyEmail = async () => {
    if (!user) throw new Error("No user logged in");
    await sendEmailVerification(user);
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (!user || !user.email) throw new Error("No user logged in");

    // Re-authenticate user before updating password
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);

    // Update password
    await firebaseUpdatePassword(user, newPassword);
  };

  const deleteAccount = async () => {
    if (!user) throw new Error("No user logged in");
    await deleteUser(user);
    setUser(null);
  };

  const updateProfile = async (data: {
    displayName?: string;
    photoURL?: string;
  }) => {
    if (!user) throw new Error("No user logged in");
    await firebaseUpdateProfile(user, data);
    setUser({ ...user, ...data });
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

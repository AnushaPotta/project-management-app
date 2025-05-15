// src/lib/auth.ts
import { auth as firebaseAuth } from './firebase';

// Export a function that mimics a session object for API routes
export const auth = async (): Promise<{ user: { id: string; email: string; name: string } } | null> => {
  const currentUser = firebaseAuth.currentUser;
  
  if (!currentUser) {
    return null;
  }
  
  return {
    user: {
      id: currentUser.uid,
      email: currentUser.email || '',
      name: currentUser.displayName || ''
    }
  };
};

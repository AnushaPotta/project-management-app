// Mock implementation for Firebase Auth
import { Auth, User, UserCredential } from 'firebase/auth';

export const onAuthStateChanged = jest.fn((auth: Auth, callback: (user: User | null) => void) => {
  callback({
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: jest.fn(),
    getIdToken: jest.fn(),
    getIdTokenResult: jest.fn(),
    reload: jest.fn(),
    toJSON: jest.fn()
  } as unknown as User);
  return jest.fn(); // Return unsubscribe function
});

export const getAuth = jest.fn(() => ({
  currentUser: {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    photoURL: null,
    providerData: [{
      providerId: 'password',
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com',
      phoneNumber: null,
      photoURL: null
    }],
    getIdToken: jest.fn().mockResolvedValue('mock-id-token')
  } as unknown as User,
  onAuthStateChanged,
  signOut: jest.fn(() => Promise.resolve())
}));

export const signInWithEmailAndPassword = jest.fn().mockImplementation(
  (auth: Auth, email: string, password: string): Promise<UserCredential> => {
    return Promise.resolve({
      user: {
        uid: 'test-user-id',
        email,
        displayName: 'Test User'
      } as unknown as User
    } as UserCredential);
  }
);

export const createUserWithEmailAndPassword = jest.fn().mockImplementation(
  (auth: Auth, email: string, password: string): Promise<UserCredential> => {
    return Promise.resolve({
      user: {
        uid: 'test-user-id',
        email,
        displayName: null
      } as unknown as User
    } as UserCredential);
  }
);

// Define GoogleAuthProvider as a class constructor
export class GoogleAuthProvider {
  addScope = jest.fn();
  providerId = 'google.com';
  
  static credential = jest.fn().mockReturnValue({
    providerId: 'google.com',
    signInMethod: 'google.com'
  });
}

export const signInWithPopup = jest.fn().mockImplementation(
  (auth: Auth, provider: any): Promise<UserCredential> => {
    return Promise.resolve({
      user: {
        uid: 'google-user-id',
        email: 'google-user@example.com',
        displayName: 'Google User'
      } as unknown as User
    } as UserCredential);
  }
);

export const EmailAuthProvider = {
  credential: jest.fn((email: string, password: string) => ({
    providerId: 'password',
    signInMethod: 'password'
  }))
};

export const sendPasswordResetEmail = jest.fn().mockResolvedValue(undefined);
export const sendEmailVerification = jest.fn().mockResolvedValue(undefined);
export const updatePassword = jest.fn().mockResolvedValue(undefined);
export const reauthenticateWithCredential = jest.fn().mockResolvedValue({} as UserCredential);
export const updateProfile = jest.fn().mockResolvedValue(undefined);

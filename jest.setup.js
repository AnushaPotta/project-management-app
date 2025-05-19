// Add custom jest matchers for Testing Library
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    reload: jest.fn(),
    refresh: jest.fn(),
    forward: jest.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Firebase
jest.mock('firebase/app', () => {
  return {
    initializeApp: jest.fn(() => ({})),
    getApps: jest.fn(() => []),
    getApp: jest.fn(() => ({})),
    FirebaseError: jest.fn().mockImplementation((code, message) => {
      return { code, message };
    }),
  };
});

jest.mock('firebase/auth', () => {
  return {
    getAuth: jest.fn(() => ({
      currentUser: {
        uid: 'test-user-id',
        displayName: 'Test User',
        email: 'test@example.com',
        emailVerified: true,
      },
      onAuthStateChanged: jest.fn((callback) => {
        callback({
          uid: 'test-user-id',
          displayName: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
        });
        return jest.fn();
      }),
    })),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    GoogleAuthProvider: jest.fn(() => ({})),
    signInWithPopup: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendEmailVerification: jest.fn(),
    updatePassword: jest.fn(),
    EmailAuthProvider: {
      credential: jest.fn(),
    },
    reauthenticateWithCredential: jest.fn(),
    updateProfile: jest.fn(),
  };
});

// Mock Apollo Client
jest.mock('@apollo/client', () => {
  const originalModule = jest.requireActual('@apollo/client');
  return {
    ...originalModule,
    useQuery: jest.fn(() => ({ loading: false, error: null, data: null })),
    useMutation: jest.fn(() => [jest.fn(), { loading: false, error: null }]),
    useLazyQuery: jest.fn(() => [jest.fn(), { loading: false, error: null, data: null }]),
  };
});

// Mock date-fns to have a fixed date for testing
jest.mock('date-fns', () => {
  const actualDateFns = jest.requireActual('date-fns');
  return {
    ...actualDateFns,
    format: jest.fn().mockImplementation(() => '2025-05-19'),
    isSameDay: jest.fn().mockImplementation(() => false),
  };
});

// Mock window.matchMedia for Chakra UI
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {
    return null;
  }
  observe() {
    return null;
  }
  takeRecords() {
    return null;
  }
  unobserve() {
    return null;
  }
};

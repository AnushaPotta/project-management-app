import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@/utils/test-utils';
import { AuthProvider } from '@/contexts/auth-context';

// Mock Login Form component for testing
const LoginForm: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const auth = require('firebase/auth');
      await auth.signInWithEmailAndPassword(auth.getAuth(), email, password);
    } catch (error: any) {
      setError('Invalid email or password');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const auth = require('firebase/auth');
      const provider = new auth.GoogleAuthProvider();
      await auth.signInWithPopup(auth.getAuth(), provider);
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {error && <div role="alert">{error}</div>}
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Sign In</button>
      </form>
      <button onClick={handleGoogleSignIn}>Continue with Google</button>
    </div>
  );
};

// Mock Signup Form component for testing
const SignupForm: React.FC = () => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const auth = require('firebase/auth');
      await auth.createUserWithEmailAndPassword(auth.getAuth(), email, password);
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {error && <div role="alert">{error}</div>}
        <div>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

// Mock Firebase auth functions with proper TypeScript typing
const mockSignInWithEmailAndPassword = jest.fn<Promise<any>, any[]>();
const mockCreateUserWithEmailAndPassword = jest.fn<Promise<any>, any[]>();
const mockSignInWithPopup = jest.fn<Promise<any>, any[]>();

jest.mock('firebase/auth', () => {
  const originalModule = jest.requireActual('firebase/auth');
  return {
    ...originalModule,
    getAuth: jest.fn(() => ({
      currentUser: null,
      onAuthStateChanged: jest.fn((callback) => {
        callback(null);
        return jest.fn();
      }),
    })),
    signInWithEmailAndPassword: (...args: any[]) => mockSignInWithEmailAndPassword(...args),
    createUserWithEmailAndPassword: (...args: any[]) => mockCreateUserWithEmailAndPassword(...args),
    signInWithPopup: (...args: any[]) => mockSignInWithPopup(...args),
    GoogleAuthProvider: jest.fn(() => ({}))
  };
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn()
  }))
}));

describe('Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('handles email/password login correctly', async () => {
      mockSignInWithEmailAndPassword.mockResolvedValueOnce({
        user: {
          uid: 'test-user-id',
          email: 'test@example.com',
          displayName: 'Test User'
        }
      });

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      // Fill in the login form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });

      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // Verify Firebase auth was called correctly
      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(),
          'test@example.com',
          'password123'
        );
      });
    });

    it('handles Google sign-in correctly', async () => {
      mockSignInWithPopup.mockResolvedValueOnce({
        user: {
          uid: 'google-user-id',
          email: 'google-user@example.com',
          displayName: 'Google User'
        }
      });

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      // Click the Google sign-in button
      fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

      // Verify the Google sign-in was triggered
      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled();
      });
    });

    it('shows error message when login fails', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValueOnce({
        code: 'auth/wrong-password',
        message: 'The password is invalid'
      });

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      // Fill in the login form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });

      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrong-password' }
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Registration Flow', () => {
    it('handles user registration correctly', async () => {
      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
        user: {
          uid: 'new-user-id',
          email: 'newuser@example.com',
          displayName: null
        }
      });

      render(
        <AuthProvider>
          <SignupForm />
        </AuthProvider>
      );

      // Fill in the registration form
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'New User' }
      });
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'newuser@example.com' }
      });

      // Use more specific selectors with testId
      fireEvent.change(screen.getByLabelText(/^Password$/), {
        target: { value: 'password123' }
      });

      fireEvent.change(screen.getByLabelText(/Confirm Password/), {
        target: { value: 'password123' }
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      // Verify Firebase auth was called correctly
      await waitFor(() => {
        expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(),
          'newuser@example.com',
          'password123'
        );
      });
    });

    it('validates password match', async () => {
      render(
        <AuthProvider>
          <SignupForm />
        </AuthProvider>
      );

      // Fill in the registration form with mismatched passwords
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'New User' }
      });
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'newuser@example.com' }
      });

      // Use more specific selectors
      fireEvent.change(screen.getByLabelText(/^Password$/), {
        target: { value: 'password123' }
      });

      fireEvent.change(screen.getByLabelText(/Confirm Password/), {
        target: { value: 'different-password' }
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      // Firebase auth should not be called
      expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
    });
  });
});

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from '@/contexts/auth-context';

// Mock Firebase modules to avoid errors
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {}
}));

// Mock auth context to avoid Firebase dependency
jest.mock('@/contexts/auth-context', () => {
  // Create auth context mock values
  const mockAuthValue = {
    user: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User'
    },
    loading: false,
    register: jest.fn(),
    login: jest.fn(),
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
    updatePassword: jest.fn(),
    deleteAccount: jest.fn(),
    updateProfile: jest.fn()
  };
  
  return {
    AuthProvider: ({ children }: any) => children,
    useAuth: () => mockAuthValue
  };
});
import { BoardProvider } from '@/contexts/board-context';
import { MockedProvider } from '@apollo/client/testing';

// Custom render function that wraps components with all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockedProvider mocks={[]} addTypename={false}>
      <ChakraProvider>
        <AuthProvider>
          <BoardProvider>
            {children}
          </BoardProvider>
        </AuthProvider>
      </ChakraProvider>
    </MockedProvider>
  );
};

// Custom render method
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };

// Apollo mock helpers
export const createMockQuery = (query: any, mockData: any, variables = {}) => {
  return {
    request: {
      query,
      variables,
    },
    result: {
      data: mockData,
    },
  };
};

export const createMockMutation = (mutation: any, mockData: any, variables = {}) => {
  return {
    request: {
      query: mutation,
      variables,
    },
    result: {
      data: mockData,
    },
  };
};

export const createMockQueryWithError = (query: any, errorMessage: string, variables = {}) => {
  return {
    request: {
      query,
      variables,
    },
    error: new Error(errorMessage),
  };
};

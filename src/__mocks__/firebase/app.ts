// Mock implementation for Firebase App
import { FirebaseApp, FirebaseOptions } from 'firebase/app';

export const initializeApp = jest.fn((options: FirebaseOptions): FirebaseApp => ({
  // Mock Firebase app instance
  name: '[DEFAULT]',
  options,
  automaticDataCollectionEnabled: false
} as unknown as FirebaseApp));

export const getApp = jest.fn((): FirebaseApp => ({
  // Mock Firebase app instance
  name: '[DEFAULT]',
  options: {},
  automaticDataCollectionEnabled: false
} as unknown as FirebaseApp));

export const getApps = jest.fn(() => []); // Return empty array to force initialization

export class FirebaseError extends Error {
  public readonly code: string;
  public readonly message: string;
  
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.message = message;
    this.name = 'FirebaseError';
  }
}

// For firebase-admin
export const cert = jest.fn(() => ({}));
export const initializeAdminApp = jest.fn(() => ({}));

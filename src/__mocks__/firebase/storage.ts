// Mock implementation for Firebase Storage
import {
  FirebaseStorage,
  StorageReference,
  UploadTask,
  UploadTaskSnapshot,
  UploadResult
} from 'firebase/storage';

// Define interfaces for our mocks
interface MockStorageRef {
  child: jest.Mock;
  put: jest.Mock;
  getDownloadURL: jest.Mock;
  delete: jest.Mock;
  fullPath: string;
  name: string;
  parent: null;
  root: null;
  bucket: string;
}

interface MockUploadTaskSnapshot {
  ref: {
    getDownloadURL: jest.Mock;
  };
  bytesTransferred: number;
  totalBytes: number;
  state: string;
  metadata: {
    name: string;
    fullPath: string;
    contentType: string;
  };
}

interface MockUploadTask {
  on: jest.Mock;
  snapshot: MockUploadTaskSnapshot;
  pause: jest.Mock;
  resume: jest.Mock;
  cancel: jest.Mock;
}

// Mock reference implementation
const mockRef: MockStorageRef = {
  child: jest.fn((path: string): MockStorageRef => ({
    ...mockRef,
    fullPath: `images/${path}`,
    name: path
  })),
  put: jest.fn((data: any) => Promise.resolve({
    ref: {
      getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/mock-image.jpg'))
    },
    metadata: {
      fullPath: 'images/mock-image.jpg'
    }
  })),
  getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/mock-image.jpg')),
  delete: jest.fn(() => Promise.resolve()),
  fullPath: 'images/mock-image.jpg',
  name: 'mock-image.jpg',
  parent: null,
  root: null,
  bucket: 'mock-bucket'
};

export const getStorage = jest.fn(() => ({
  ref: jest.fn(() => mockRef)
}) as unknown as FirebaseStorage);

export const ref = jest.fn(() => mockRef as unknown as StorageReference);

// Mock upload task implementation
const mockUploadTask: MockUploadTask = {
  on: jest.fn((event: string, 
              progressCallback?: ((snapshot: UploadTaskSnapshot) => void) | null,
              errorCallback?: ((error: Error) => void) | null,
              completeCallback?: ((result: UploadResult) => void) | null): MockUploadTask => {
    // Simulate a successful upload
    if (completeCallback) {
      completeCallback({
        ref: {
          getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/mock-image.jpg'))
        } as any, // Using 'any' here since we're only mocking a subset of StorageReference
        metadata: {
          name: 'mock-image.jpg',
          fullPath: 'images/mock-image.jpg',
          size: 12345,
          contentType: 'image/jpeg',
          timeCreated: new Date().toISOString(),
          updated: new Date().toISOString(),
          md5Hash: 'mock-md5-hash',
          bucket: 'mock-bucket',
          generation: '1',
          metageneration: '1',
          downloadTokens: ['mock-token']
        }
      });
    }
    return mockUploadTask;
  }),
  snapshot: {
    ref: {
      getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/mock-image.jpg')),
      fullPath: 'images/mock-image.jpg',
      name: 'mock-image.jpg',
      bucket: 'mock-bucket'
    } as any, // Using 'any' to satisfy TypeScript
    bytesTransferred: 100,
    totalBytes: 100,
    state: 'success',
    metadata: {
      name: 'mock-image.jpg',
      fullPath: 'images/mock-image.jpg',
      contentType: 'image/jpeg'
    }
  },
  pause: jest.fn(() => Promise.resolve()),
  resume: jest.fn(() => Promise.resolve()),
  cancel: jest.fn(() => Promise.resolve())
};

export const uploadBytesResumable = jest.fn(() => 
  mockUploadTask as unknown as UploadTask
);

export const getDownloadURL = jest.fn(() => 
  Promise.resolve('https://example.com/mock-image.jpg')
);

export const deleteObject = jest.fn(() => Promise.resolve());

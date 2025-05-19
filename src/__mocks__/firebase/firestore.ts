// Mock implementation for Firebase Firestore
import { 
  DocumentReference, 
  CollectionReference, 
  DocumentData,
  Firestore,
  FieldValue,
  DocumentSnapshot,
  Query,
  QuerySnapshot
} from 'firebase/firestore';

// Create our own Timestamp interface to avoid conflicts
interface MockTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
  valueOf: () => number;
  toMillis: () => number;
  isEqual: (other: MockTimestamp) => boolean;
}

const mockDocData = (): Partial<DocumentSnapshot> => ({
  exists: true as any, // Type coercion needed for the mock
  data: () => ({}),
  id: 'mock-doc-id',
  ref: {
    // Using any here since we're only partially implementing the interface
    update: jest.fn(() => Promise.resolve()),
    set: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve())
  } as any
});

type MockCollection = {
  doc: jest.Mock;
  add: jest.Mock;
  where: jest.Mock;
};

const mockCollection = (): MockCollection => ({
  doc: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve(mockDocData())),
    set: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
    collection: jest.fn(() => mockCollection())
  })),
  add: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  where: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({
      empty: false,
      docs: [
        {
          id: 'mock-doc-id',
          data: () => ({}),
          ref: {
            update: jest.fn(() => Promise.resolve())
          }
        }
      ]
    })),
    where: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({
        empty: false,
        docs: [
          {
            id: 'mock-doc-id',
            data: () => ({}),
            ref: {
              update: jest.fn(() => Promise.resolve())
            }
          }
        ]
      }))
    }))
  }))
});

export const getFirestore = jest.fn(() => ({
  collection: jest.fn(() => mockCollection())
}) as unknown as Firestore);

export const collection = jest.fn(() => mockCollection() as unknown as CollectionReference<DocumentData>);

export const doc = jest.fn(() => ({
  get: jest.fn(() => Promise.resolve(mockDocData())),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve())
}) as unknown as DocumentReference<DocumentData>);

const timestamp = {
  seconds: Math.floor(Date.now() / 1000),
  nanoseconds: 0,
  toDate: jest.fn(() => new Date()),
  valueOf: jest.fn(() => Math.floor(Date.now() / 1000) * 1000),
  toMillis: jest.fn(() => Math.floor(Date.now())),
  isEqual: jest.fn(() => true)
};

// Export our mock timestamp implementation
export const Timestamp = {
  now: jest.fn(() => timestamp as unknown as MockTimestamp),
  fromDate: jest.fn(() => timestamp as unknown as MockTimestamp),
  fromMillis: jest.fn(() => timestamp as unknown as MockTimestamp)
} as const;

export const serverTimestamp = jest.fn(() => ({
  seconds: Math.floor(Date.now() / 1000),
  nanoseconds: 0
}) as unknown as FieldValue);

export const getDocs = jest.fn(() => Promise.resolve({
  docs: [
    {
      id: 'mock-doc-id',
      data: () => ({}),
      ref: {
        id: 'mock-doc-id'
      }
    }
  ],
  forEach: jest.fn((callback) => {
    callback({
      id: 'mock-doc-id',
      data: () => ({}),
      ref: {
        id: 'mock-doc-id'
      }
    });
  })
}));

export const getDoc = jest.fn(() => Promise.resolve(mockDocData()));
export const setDoc = jest.fn(() => Promise.resolve());
export const updateDoc = jest.fn(() => Promise.resolve());
export const deleteDoc = jest.fn(() => Promise.resolve());
export const addDoc = jest.fn(() => Promise.resolve({ id: 'mock-doc-id' }));
export const where = jest.fn(() => ({}));
export const query = jest.fn(() => ({}));
export const orderBy = jest.fn(() => ({}));
export const limit = jest.fn(() => ({}));

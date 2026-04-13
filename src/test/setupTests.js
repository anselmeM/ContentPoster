import '@testing-library/jest-dom';

// Mock environment variables for Vite
Object.defineProperty(window, 'import', {
  writable: true,
  value: {
    meta: {
      env: {
        VITE_FIREBASE_API_KEY: 'test-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID: 'test-project',
        VITE_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        VITE_FIREBASE_APP_ID: '1:123456789:web:abc123',
        VITE_FIREBASE_MEASUREMENT_ID: 'G-TEST123'
      }
    }
  }
});

// Mock Firebase config
vi.mock('../config/firebase', () => ({
  __esModule: true,
  default: {
    apiKey: 'test-api-key',
    authDomain: 'test.firebaseapp.com',
    projectId: 'test-project',
    storageBucket: 'test.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abc123',
    measurementId: 'G-TEST123'
  }
}));

// Mock Firebase auth with proper credential handling
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
    app: {}
  })),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback(null);
    return vi.fn();
  }),
  createUserWithEmailAndPassword: vi.fn(() => 
    Promise.resolve({ user: { uid: 'test-user-id', email: 'test@test.com' } })
  ),
  signInWithEmailAndPassword: vi.fn(() => 
    Promise.resolve({ user: { uid: 'test-user-id', email: 'test@test.com' } })
  ),
  signOut: vi.fn(() => Promise.resolve()),
  updatePassword: vi.fn(() => Promise.resolve()),
  EmailAuthProvider: { 
    credential: vi.fn((email, password) => ({
      providerId: 'password',
      signInMethod: 'password',
      toJSON: () => ({})
    })) 
  },
  reauthenticateWithCredential: vi.fn(() => 
    Promise.resolve({ user: { uid: 'test-user-id' } })
  ),
  OAuthProvider: vi.fn(() => ({
    providerId: 'oauth',
    addScope: vi.fn(),
    setCustomParameters: vi.fn()
  })),
  GoogleAuthProvider: vi.fn(() => ({
    providerId: 'google.com',
    addScope: vi.fn()
  })),
  GithubAuthProvider: vi.fn(() => ({
    providerId: 'github.com',
    addScope: vi.fn()
  })),
  signInWithPopup: vi.fn(() => 
    Promise.resolve({ user: { uid: 'test-user-id', email: 'test@test.com' } })
  ),
  signInWithRedirect: vi.fn(() => Promise.resolve()),
  getRedirectResult: vi.fn(() => Promise.resolve(null)),
  updateProfile: vi.fn(() => Promise.resolve()),
  sendEmailVerification: vi.fn(() => Promise.resolve()),
  sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
  verifyBeforeUpdateEmail: vi.fn(() => Promise.resolve()),
  delete: vi.fn(() => Promise.resolve()),
  reload: vi.fn(() => Promise.resolve()),
  getIdToken: vi.fn(() => Promise.resolve('test-token')),
  getIdTokenResult: vi.fn(() => Promise.resolve({
    token: 'test-token',
    expirationTime: '2024-01-01T00:00:00.000Z',
    authTime: '2024-01-01T00:00:00.000Z',
    claims: {}
  })),
  linkWithPopup: vi.fn(() => Promise.resolve({ user: {} })),
  linkWithRedirect: vi.fn(() => Promise.resolve()),
  unlink: vi.fn(() => Promise.resolve({ user: {} })),
  onIdTokenChanged: vi.fn((auth, callback) => {
    callback(null);
    return vi.fn();
  }),
  currentUser: null,
  auth: null
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({ id: 'mock-doc-id' })),
  onSnapshot: vi.fn((doc, callback) => {
    callback({ exists: () => false, data: () => ({}), id: 'mock-doc-id' });
    return vi.fn();
  }),
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  setDoc: vi.fn(() => Promise.resolve()),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
  getDocs: vi.fn(() => Promise.resolve({ docs: [], empty: true })),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  endAt: vi.fn(),
  serverTimestamp: vi.fn(() => new Date().toISOString()),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromMillis: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 }))
  }
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(() => Promise.resolve()),
  getDownloadURL: vi.fn(() => Promise.resolve('https://test.firebase.com/test.jpg')),
  deleteObject: vi.fn(() => Promise.resolve())
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Silence console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
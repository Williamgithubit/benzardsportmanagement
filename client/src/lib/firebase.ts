import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Read config from NEXT_PUBLIC_ env vars (safe to expose to client)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

// Basic contract: exports singletons for app/auth/firestore/storage or null if not configured
export type FirebaseClient = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _firestore: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

const isConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

if (isConfigured) {
  try {
    // Initialize only once (works both on client and server-safe for modular SDK without analytics)
    _app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    _auth = getAuth(_app);
    _firestore = getFirestore(_app);
    _storage = getStorage(_app);
  } catch (err) {
    // Don't crash the app during build — surface the error for debugging
     
    console.error('Failed to initialize Firebase client SDK', err);
    _app = _auth = _firestore = _storage = null;
  }
} else {
  if (typeof window !== 'undefined') {
     
    console.warn('Firebase client not configured. Set NEXT_PUBLIC_FIREBASE_* env vars.');
  }
}

export const firebaseClientConfigured = isConfigured;

export function getFirebaseClient(): FirebaseClient {
  if (!isConfigured || !_app || !_auth || !_firestore || !_storage) {
    throw new Error(
      'Firebase client is not initialized. Ensure NEXT_PUBLIC_FIREBASE_* env vars are set and the SDK is initialized in a client-side environment.'
    );
  }

  return {
    app: _app,
    auth: _auth,
    firestore: _firestore,
    storage: _storage,
  };
}

// Convenience exports (may be null if not configured)
export const firebaseApp = _app;
export const firebaseAuth = _auth;
export const firebaseFirestore = _firestore;
export const firebaseStorage = _storage;

export default {
  getFirebaseClient,
  firebaseApp,
  firebaseAuth,
  firebaseFirestore,
  firebaseStorage,
  firebaseClientConfigured,
};

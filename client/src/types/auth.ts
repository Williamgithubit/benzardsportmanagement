// Define the user roles
export type UserRole =
  | 'admin'
  | 'manager'
  | 'coach'
  | 'athlete'
  | 'sponsor'
  | 'media'
  | 'teacher'
  | 'parent'
  | 'student'
  | 'user';

export type UserStatus = 'active' | 'inactive' | 'suspended';

// Define login credentials interface
export interface LoginCredentials {
  email: string;
  password: string;
}

// Import Firebase Timestamp type
import { Timestamp } from 'firebase/firestore';

// Use Firebase's Timestamp directly
export type FirestoreTimestamp = Timestamp;

// Define the user interface
export interface User {
  uid: string;
  email: string | null;
  name: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  phoneNumber?: string;
  address?: string;
  emailVerified: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  providerData: Array<{
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    providerId: string;
  }>;
  createdAt?: FirestoreTimestamp | string;
  updatedAt?: FirestoreTimestamp | string;
  lastLoginAt?: FirestoreTimestamp | string;
}

// Define the auth state interface
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  isAuthenticated: boolean;
  initialized: boolean;
  token?: string;
  refreshToken?: string;
}

// Response types for authentication operations
export interface AuthResponse {
  user: User | null;
  token?: string;
  refreshToken?: string;
  error?: string;
  success: boolean;
}

export interface AuthError {
  code: string;
  message: string;
  details?: unknown;
}

// Type guard to check if an error is an AuthError
export function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

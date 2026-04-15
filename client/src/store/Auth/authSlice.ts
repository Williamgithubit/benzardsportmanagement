import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, type User as FirebaseAuthUser } from 'firebase/auth';
import { auth, db } from '@/services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { LoginCredentials, User, UserRole } from '@/types/auth';

// Define the auth state interface
interface AuthState {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

type ClaimsMap = Record<string, unknown>;
type StoredUserData = Partial<User> &
  Record<string, unknown> & {
    displayName?: string;
    avatar?: string;
    avatarPublicId?: string;
    phone?: string;
    teamId?: string;
    teamIds?: string[];
  };

const USER_ROLES: UserRole[] = [
  'admin',
  'statistician',
  'manager',
  'coach',
  'athlete',
  'sponsor',
  'media',
  'teacher',
  'parent',
  'student',
  'user',
];
const USER_STATUSES = ['active', 'inactive', 'suspended'] as const;

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && USER_ROLES.includes(value as UserRole);

const isUserStatus = (
  value: unknown
): value is User['status'] =>
  typeof value === 'string' &&
  USER_STATUSES.includes(value as User['status']);

const getRoleFromClaims = (claims: ClaimsMap): UserRole | null => {
  if (claims.admin === true) {
    return 'admin';
  }

  return isUserRole(claims.role) ? claims.role : null;
};

const isPermissionDeniedError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code =
    'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  const message =
    'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : '';

  return (
    code.includes('permission-denied') ||
    message.includes('Missing or insufficient permissions')
  );
};

const getProfileAccessErrorMessage = () =>
  'Signed in to Firebase, but the app could not read your profile from Firestore. Check your users collection rules or run the admin bootstrap script.';

const getMissingProfileErrorMessage = () =>
  'Sign-in succeeded, but no user profile or role claim was found. Run the admin bootstrap script to create the admin profile.';

const buildUserProfile = (
  firebaseUser: FirebaseAuthUser,
  userData: StoredUserData = {},
  roleOverride?: UserRole
): User => {
  const role =
    roleOverride ||
    (isUserRole(userData.role) ? userData.role : 'user');
  const fallbackName =
    (typeof userData.displayName === 'string' && userData.displayName) ||
    firebaseUser.displayName ||
    firebaseUser.email?.split('@')[0] ||
    'User';
  const name =
    (typeof userData.name === 'string' && userData.name) || fallbackName;
  const displayName =
    (typeof userData.displayName === 'string' && userData.displayName) ||
    firebaseUser.displayName ||
    undefined;
  const photoURL =
    (typeof userData.photoURL === 'string' && userData.photoURL) ||
    (typeof userData.avatar === 'string' && userData.avatar) ||
    firebaseUser.photoURL ||
    undefined;
  const phoneNumber =
    (typeof userData.phoneNumber === 'string' && userData.phoneNumber) ||
    (typeof userData.phone === 'string' && userData.phone) ||
    firebaseUser.phoneNumber ||
    undefined;
  const photoPublicId =
    (typeof userData.photoPublicId === 'string' && userData.photoPublicId) ||
    (typeof userData.avatarPublicId === 'string' && userData.avatarPublicId) ||
    undefined;

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name,
    displayName,
    photoURL,
    photoPublicId,
    role,
    status: isUserStatus(userData.status) ? userData.status : 'active',
    teamId:
      typeof userData.teamId === 'string' && userData.teamId.trim()
        ? userData.teamId.trim()
        : undefined,
    teamIds: Array.isArray(userData.teamIds)
      ? userData.teamIds.filter(
          (teamId): teamId is string =>
            typeof teamId === 'string' && Boolean(teamId.trim()),
        )
      : undefined,
    phoneNumber,
    address:
      typeof userData.address === 'string' ? userData.address : undefined,
    bio: typeof userData.bio === 'string' ? userData.bio : undefined,
    emailVerified: firebaseUser.emailVerified,
    metadata: {
      creationTime: firebaseUser.metadata.creationTime || undefined,
      lastSignInTime: firebaseUser.metadata.lastSignInTime || undefined,
    },
    providerData: firebaseUser.providerData.map((provider) => ({
      uid: provider.uid,
      displayName: provider.displayName,
      email: provider.email,
      photoURL: provider.photoURL,
      providerId: provider.providerId,
    })),
    createdAt:
      userData.createdAt || firebaseUser.metadata.creationTime || new Date().toISOString(),
    updatedAt: userData.updatedAt || new Date().toISOString(),
    lastLoginAt:
      userData.lastLoginAt || firebaseUser.metadata.lastSignInTime || undefined,
  };
};

const buildFirestoreUserUpdate = (user: User) => ({
  uid: user.uid,
  email: user.email,
  name: user.name,
  displayName: user.displayName || user.name,
  role: user.role,
  status: user.status,
  teamId: user.teamId || null,
  teamIds: user.teamIds || (user.teamId ? [user.teamId] : []),
  photoURL: user.photoURL || null,
  photoPublicId: user.photoPublicId || null,
  phoneNumber: user.phoneNumber || null,
  address: user.address || null,
  bio: user.bio || null,
  emailVerified: user.emailVerified,
  metadata: user.metadata,
  providerData: user.providerData,
  createdAt: user.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
});

const resolveAuthenticatedUser = async (
  firebaseUser: FirebaseAuthUser,
  { forceRefreshClaims = false }: { forceRefreshClaims?: boolean } = {}
): Promise<{ user: User; canPersistProfile: boolean }> => {
  if (forceRefreshClaims) {
    await firebaseUser.getIdToken(true);
  }

  const { claims } = await firebaseUser.getIdTokenResult();
  const claimedRole = getRoleFromClaims(claims as ClaimsMap);
  const userDocRef = doc(db, 'users', firebaseUser.uid);

  try {
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = convertTimestamps(userDoc.data() as StoredUserData);

      return {
        user: buildUserProfile(firebaseUser, userData, claimedRole || undefined),
        canPersistProfile: true,
      };
    }
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      if (claimedRole) {
        return {
          user: buildUserProfile(firebaseUser, {}, claimedRole),
          canPersistProfile: false,
        };
      }

      throw new Error(getProfileAccessErrorMessage());
    }

    throw error;
  }

  if (claimedRole) {
    return {
      user: buildUserProfile(firebaseUser, {}, claimedRole),
      canPersistProfile: true,
    };
  }

  throw new Error(getMissingProfileErrorMessage());
};

// Helper function to convert Firebase Timestamp to Date string or return as is
const convertTimestamps = <T>(obj: T): T => {
  if (!obj) return obj;
  
  // If it's a Firebase Timestamp
  if (typeof obj === 'object' && obj !== null && 'toDate' in obj && typeof (obj as { toDate: () => Date }).toDate === 'function') {
    return (obj as { toDate: () => Date }).toDate().toISOString() as unknown as T;
  }
  
  // If it's an array, process each item
  if (Array.isArray(obj)) {
    return obj.map(convertTimestamps) as unknown as T;
  }
  
  // If it's an object, process each property
  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = convertTimestamps((obj as Record<string, unknown>)[key]);
      }
    }
    return result as T;
  }
  
  // Return primitives as-is
  return obj;
};

// Initial state
const initialState: AuthState = {
  user: null,
  role: null,
  loading: true,
  error: null,
  isAuthenticated: false,
};

// Initialize auth state listener
export const initializeAuth = createAsyncThunk<
  { user: User | null; isAuthenticated: boolean },
  void,
  { rejectValue: string }
>(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      return new Promise<{ user: User | null; isAuthenticated: boolean }>((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          unsubscribe();

          try {
            if (firebaseUser) {
              const { user } = await resolveAuthenticatedUser(firebaseUser);

              console.log('Auth state changed - user authenticated:', user);
              resolve({ user, isAuthenticated: true });
            } else {
              // User is signed out
              console.log('Auth state changed - user signed out');
              resolve({ user: null, isAuthenticated: false });
            }
          } catch (error) {
            console.error('Error in auth state listener:', error);
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('Initialize auth error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Auth initialization failed');
    }
  }
);

// Logout async thunk
export const logout = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Logging out user...');
      await firebaseSignOut(auth);
      console.log('Firebase logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Logout failed');
    }
  }
);

export const login = createAsyncThunk<
  User,
  LoginCredentials,
  { rejectValue: string }
>(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      console.log('Attempting to sign in with:', { email });
      
      // First, verify the user exists and the password is correct
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        const error = err as { code: string; message: string };
        console.error('Firebase Auth Error:', {
          code: error.code,
          message: error.message,
          email: email,
          timestamp: new Date().toISOString()
        });
        
        // Provide more specific error messages
        if (error.code === 'auth/user-not-found') {
          return rejectWithValue('No user found with this email address');
        } else if (error.code === 'auth/wrong-password') {
          return rejectWithValue('Incorrect password');
        } else if (error.code === 'auth/too-many-requests') {
          return rejectWithValue('Too many failed login attempts. Please try again later.');
        } else if (error.code === 'auth/user-disabled') {
          return rejectWithValue('This account has been disabled');
        } else {
          return rejectWithValue(`Authentication failed: ${error.message}`);
        }
      }
      
      const firebaseUser = userCredential.user;
      const userEmail = firebaseUser.email;

      if (!userEmail) {
        console.error('User email is missing after successful authentication');
        return rejectWithValue('User email is missing');
      }

      const { user: userUpdate, canPersistProfile } = await resolveAuthenticatedUser(
        firebaseUser,
        { forceRefreshClaims: true }
      );

      if (canPersistProfile) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        try {
          await setDoc(userDocRef, buildFirestoreUserUpdate(userUpdate), {
            merge: true,
          });
        } catch (error) {
          if (isPermissionDeniedError(error)) {
            console.warn(
              'Skipping profile sync because Firestore denied write access to users/{uid}.'
            );
          } else {
            throw error;
          }
        }
      }

      return userUpdate;
    } catch (error) {
      console.error('Login error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

// Update user profile async thunk
export const updateUser = createAsyncThunk<
  User,
  Partial<User>,
  { rejectValue: string }
>(
  'auth/updateUser',
  async (userData, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const currentUser = state.auth.user;
      
      if (!currentUser) {
        return rejectWithValue('No authenticated user found');
      }

      // Update user document in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updateData = {
        ...userData,
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(userDocRef, updateData, { merge: true });
      
      // Return the updated user object
      const updatedUser: User = {
        ...currentUser,
        ...updateData,
        uid: currentUser.uid,
        role: isUserRole(updateData.role) ? updateData.role : currentUser.role,
        status: isUserStatus(updateData.status)
          ? updateData.status
          : currentUser.status,
      };
      
      console.log('User profile updated successfully:', updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update user error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Update failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearUser: (state) => {
      state.user = null;
      state.role = null;
      state.loading = false;
      state.isAuthenticated = false;
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        console.log('Auth initialization pending...');
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        console.log('Auth initialization fulfilled:', action.payload);
        state.loading = false;
        if (action.payload.user) {
          state.user = action.payload.user;
          state.role = action.payload.user.role;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.role = null;
          state.isAuthenticated = false;
        }
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state) => {
        console.error('Auth initialization rejected');
        state.loading = false;
        state.user = null;
        state.role = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(login.pending, (state) => {
        console.log('Login pending...');
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log('Login fulfilled with payload:', action.payload);
        state.loading = false;
        state.user = action.payload;
        state.role = action.payload.role;
        state.isAuthenticated = true;
        state.error = null;
        console.log('Updated auth state after login:', JSON.stringify({
          user: state.user ? { ...state.user, password: '***' } : null,
          role: state.role,
          isAuthenticated: state.isAuthenticated,
          loading: state.loading,
          error: state.error
        }, null, 2));
      })
      .addCase(login.rejected, (state, action) => {
        console.error('Login rejected:', action.payload || 'Unknown error');
        state.loading = false;
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
      })
      .addCase(logout.pending, (state) => {
        console.log('Logout pending...');
        state.loading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        console.log('Logout fulfilled');
        state.loading = false;
        state.user = null;
        state.role = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        console.error('Logout rejected:', action.payload || 'Unknown error');
        state.loading = false;
        state.error = action.payload || 'Logout failed';
        // Still clear user data even if logout fails
        state.user = null;
        state.role = null;
        state.isAuthenticated = false;
      })
      .addCase(updateUser.pending, (state) => {
        console.log('Update user pending...');
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        console.log('Update user fulfilled:', action.payload);
        state.loading = false;
        state.user = action.payload;
        state.role = action.payload.role;
        state.error = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        console.error('Update user rejected:', action.payload || 'Unknown error');
        state.loading = false;
        state.error = action.payload || 'Update failed';
      });
  },
});

// Selectors
export const selectAuthState = (state: { auth: AuthState }) => state.auth;

export const selectCurrentUser = createSelector(
  [selectAuthState],
  (auth) => auth.user
);

export const selectIsAuthenticated = createSelector(
  [selectAuthState],
  (auth) => auth.isAuthenticated
);

export const selectAuthLoading = createSelector(
  [selectAuthState],
  (auth) => auth.loading
);

export const selectAuthError = createSelector(
  [selectAuthState],
  (auth) => auth.error
);

export const { clearUser, setError, clearError } = authSlice.actions;

export default authSlice.reducer;

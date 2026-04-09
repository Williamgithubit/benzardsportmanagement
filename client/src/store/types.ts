import { User } from "@/types/auth";

// Define login credentials type
export interface LoginCredentials {
  email: string;
  password: string;
}

// Define the auth state type
export interface UserType {
  id: string;
  name?: string;
  email?: string;
  displayName?: string;
  role?: string;
  status?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthStateType {
  user: UserType | null;
  role: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Define user management types
export interface UserManagementState {
  users: UserType[];
  loading: boolean;
  error: string | null;
  currentUser: UserType | null;
  success: boolean;
}

// Define program types
export interface ProgramType {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "active" | "inactive" | "completed";
  capacity: number;
  enrolled: number;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramState {
  programs: ProgramType[];
  loading: boolean;
  error: string | null;
  currentProgram: ProgramType | null;
  success: boolean;
}

// Define action types
export type ApiError = {
  status: number;
  data: {
    message: string;
    errors?: Record<string, string[]>;
  };
};

// Define the root state type based on the store's reducer structure
export interface RootState {
  auth: AuthStateType;
  api: Record<string, unknown>;
  userManagement: UserManagementState;
  program: ProgramState;
  _persist?: {
    version: number;
    rehydrated: boolean;
  };
}

// Export AppDispatch type that will be inferred from the store
export type AppDispatch = import("@reduxjs/toolkit").ThunkDispatch<
  RootState,
  unknown,
  import("@reduxjs/toolkit").UnknownAction
> &
  import("redux").Dispatch<import("@reduxjs/toolkit").UnknownAction>;

// Extend the RootState to include all your state slices
declare module "react-redux" {
  interface DefaultRootState extends RootState {
    auth: AuthStateType;
    api: Record<string, unknown>;
    userManagement: UserManagementState;
    program: ProgramState;
  }
}

import { createAsyncThunk, createSlice, createSelector } from '@reduxjs/toolkit';
import { createUser, getAllUsers, updateUserRole, deleteUser } from '../../services/userManagementService';

export const addNewUser = createAsyncThunk(
  'userManagement/addNewUser',
  async (userData, { rejectWithValue }) => {
    try {
      const result = await createUser(userData);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAllUsers = createAsyncThunk(
  'userManagement/fetchAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      const users = await getAllUsers();
      return users;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'userManagement/updateUser',
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      const result = await updateUserRole(userId, role);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeUser = createAsyncThunk(
  'userManagement/deleteUser',
  async ({ userId, authUid = null }, { rejectWithValue }) => {
    try {
      const result = await deleteUser(userId, authUid);
      return { userId, ...result };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  users: [],
  loading: false,
  error: null,
  success: false,
  currentPage: 1,
  itemsPerPage: 10,
  filters: {
    role: '',
    search: '',
  },
};

const userManagementSlice = createSlice({
  name: 'userManagement',
  initialState,
  reducers: {
    resetStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1;
    },
    setPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setItemsPerPage: (state, action) => {
      state.itemsPerPage = action.payload;
      state.currentPage = 1;
    },
  },
  extraReducers: (builder) => {
    // Add New User
    builder
      .addCase(addNewUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addNewUser.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        // Avoid duplicating users; rely on fetchAllUsers in UserManagement
        state.error = null;
      })
      .addCase(addNewUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch All Users
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
        state.totalItems = action.payload.length;
        state.error = null;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update User Role
    builder
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Update the user in the local state
        const updatedUser = action.payload;
        const userIndex = state.users.findIndex(user => user.id === updatedUser.userId);
        if (userIndex !== -1) {
          state.users[userIndex].role = updatedUser.role;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete User
    builder
      .addCase(removeUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Remove the user from the local state
        state.users = state.users.filter(user => user.id !== action.payload.userId);
        state.totalItems = state.users.length;
      })
      .addCase(removeUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectUserManagement = (state) => state.userManagement;

export const selectAllUsers = createSelector(
  [selectUserManagement],
  (userManagement) => {
    const { users, filters } = userManagement;
    return users.filter((user) => {
      const matchesRole = !filters.role || user.role === filters.role;
      const matchesSearch = !filters.search ||
        user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.name?.toLowerCase().includes(filters.search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }
);

// New selectors for AdminDashboard
export const selectUsers = createSelector(
  [selectAllUsers],
  (users) => users
);

export const selectUsersLoading = createSelector(
  [selectUserManagement],
  (userManagement) => userManagement.loading
);

export const selectUsersError = createSelector(
  [selectUserManagement],
  (userManagement) => userManagement.error
);

export const selectUserManagementState = createSelector(
  [selectUserManagement, selectAllUsers],
  (userManagement, filteredUsers) => ({
    ...userManagement,
    users: filteredUsers,
  })
);

export const { resetStatus, setFilter, setPage, setItemsPerPage } = userManagementSlice.actions;

export default userManagementSlice.reducer;
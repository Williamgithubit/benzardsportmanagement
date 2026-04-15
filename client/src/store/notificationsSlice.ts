import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { NotificationService } from "@/services/notificationService";
import type { Notification } from "@/types/notification";

interface NotificationsState {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

export const markNotificationRead = createAsyncThunk<
  void,
  { id: string; read?: boolean },
  { rejectValue: string }
>("notifications/markNotificationRead", async ({ id, read }, { rejectWithValue }) => {
  try {
    await NotificationService.markAsRead(id, read ?? true);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to update notification",
    );
  }
});

export const markAllNotificationsRead = createAsyncThunk<
  void,
  { role?: string | null; userId?: string | null; teamId?: string | null } | undefined,
  { rejectValue: string }
>("notifications/markAllNotificationsRead", async (filters, { rejectWithValue }) => {
  try {
    await NotificationService.markAllAsRead(filters || {});
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to update notifications",
    );
  }
});

export const deleteNotification = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("notifications/deleteNotification", async (id, { rejectWithValue }) => {
  try {
    await NotificationService.deleteNotification(id);
    return id;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to delete notification",
    );
  }
});

export const clearAllNotifications = createAsyncThunk<
  void,
  { role?: string | null; userId?: string | null; teamId?: string | null } | undefined,
  { rejectValue: string }
>("notifications/clearAllNotifications", async (filters, { rejectWithValue }) => {
  try {
    await NotificationService.clearAllNotifications(filters || {});
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to clear notifications",
    );
  }
});

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotificationsLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setNotificationsError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setNotifications(state, action: PayloadAction<Notification[]>) {
      state.items = action.payload;
      state.unreadCount = action.payload.filter((item) => !item.read).length;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(markNotificationRead.pending, (state) => {
        state.error = null;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        void action;
      })
      .addCase(markNotificationRead.rejected, (state, action) => {
        state.error = action.payload || "Failed to update notification";
      })
      .addCase(markAllNotificationsRead.rejected, (state, action) => {
        state.error = action.payload || "Failed to update notifications";
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.unreadCount = state.items.filter((item) => !item.read).length;
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete notification";
      })
      .addCase(clearAllNotifications.rejected, (state, action) => {
        state.error = action.payload || "Failed to clear notifications";
      });
  },
});

export const {
  setNotificationsLoading,
  setNotificationsError,
  setNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;

import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import MediaDashboardService from "@/services/mediaDashboardService";
import type {
  TeamAnnouncementRecord,
  TeamMediaRecord,
  TeamPostRecord,
} from "@/types/media-dashboard";

interface MediaState {
  posts: TeamPostRecord[];
  media: TeamMediaRecord[];
  announcements: TeamAnnouncementRecord[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: MediaState = {
  posts: [],
  media: [],
  announcements: [],
  loading: false,
  saving: false,
  error: null,
};

export const createTeamPost = createAsyncThunk<
  string,
  {
    teamId: string;
    type: TeamPostRecord["type"];
    status: TeamPostRecord["status"];
    title: string;
    content: string;
    mediaIds: string[];
    scheduledFor?: string | null;
    createdBy?: string | null;
  },
  { rejectValue: string }
>("media/createPost", async (payload, { rejectWithValue }) => {
  try {
    const { teamId, ...data } = payload;
    return await MediaDashboardService.createPost(teamId, data);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to create post",
    );
  }
});

export const updateTeamPost = createAsyncThunk<
  void,
  {
    postId: string;
    updates: Partial<Omit<TeamPostRecord, "id" | "teamId" | "createdAt" | "updatedAt">>;
  },
  { rejectValue: string }
>("media/updatePost", async ({ postId, updates }, { rejectWithValue }) => {
  try {
    await MediaDashboardService.updatePost(postId, updates);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to update post",
    );
  }
});

export const deleteTeamPost = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>("media/deletePost", async (postId, { rejectWithValue }) => {
  try {
    await MediaDashboardService.deletePost(postId);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to delete post",
    );
  }
});

export const uploadTeamMediaAsset = createAsyncThunk<
  string,
  {
    teamId: string;
    file: File;
    uploadedBy: string;
    title?: string;
    tags?: string[];
    matchId?: string | null;
    playerId?: string | null;
    eventId?: string | null;
  },
  { rejectValue: string }
>("media/uploadAsset", async (payload, { rejectWithValue }) => {
  try {
    const { teamId, ...data } = payload;
    return await MediaDashboardService.uploadTeamMedia(teamId, data);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to upload media",
    );
  }
});

export const deleteTeamMediaAsset = createAsyncThunk<
  void,
  TeamMediaRecord,
  { rejectValue: string }
>("media/deleteAsset", async (payload, { rejectWithValue }) => {
  try {
    await MediaDashboardService.deleteTeamMedia(payload);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to delete media",
    );
  }
});

export const createTeamAnnouncement = createAsyncThunk<
  string,
  {
    teamId: string;
    title: string;
    content: string;
    audiences: Array<"players" | "staff">;
    createdBy?: string | null;
  },
  { rejectValue: string }
>("media/createAnnouncement", async (payload, { rejectWithValue }) => {
  try {
    const { teamId, ...data } = payload;
    return await MediaDashboardService.createAnnouncement(teamId, data);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to create announcement",
    );
  }
});

const mediaSlice = createSlice({
  name: "media",
  initialState,
  reducers: {
    setMediaLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setMediaError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setTeamPosts(state, action: PayloadAction<TeamPostRecord[]>) {
      state.posts = action.payload;
      state.loading = false;
    },
    setTeamMedia(state, action: PayloadAction<TeamMediaRecord[]>) {
      state.media = action.payload;
      state.loading = false;
    },
    setTeamAnnouncements(state, action: PayloadAction<TeamAnnouncementRecord[]>) {
      state.announcements = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTeamPost.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createTeamPost.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createTeamPost.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to create post";
      })
      .addCase(updateTeamPost.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateTeamPost.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateTeamPost.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to update post";
      })
      .addCase(deleteTeamPost.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteTeamPost.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(deleteTeamPost.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to delete post";
      })
      .addCase(uploadTeamMediaAsset.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(uploadTeamMediaAsset.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(uploadTeamMediaAsset.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to upload media";
      })
      .addCase(deleteTeamMediaAsset.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteTeamMediaAsset.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(deleteTeamMediaAsset.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to delete media";
      })
      .addCase(createTeamAnnouncement.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createTeamAnnouncement.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createTeamAnnouncement.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to create announcement";
      });
  },
});

export const {
  setMediaLoading,
  setMediaError,
  setTeamPosts,
  setTeamMedia,
  setTeamAnnouncements,
} = mediaSlice.actions;

export default mediaSlice.reducer;

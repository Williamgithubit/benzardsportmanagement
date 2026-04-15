import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import AttendanceService, {
  type AttendanceDraft,
  type TrainingSessionInput,
} from "@/services/attendanceService";
import type {
  AttendanceAnalytics,
  AttendanceRecord,
  TrainingSessionRecord,
} from "@/types/sports";
import { emptyAttendanceAnalytics } from "@/types/sports";

interface AttendanceState {
  sessions: TrainingSessionRecord[];
  records: AttendanceRecord[];
  analytics: AttendanceAnalytics;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: AttendanceState = {
  sessions: [],
  records: [],
  analytics: emptyAttendanceAnalytics,
  loading: false,
  saving: false,
  error: null,
};

export const createTrainingSession = createAsyncThunk<
  string,
  TrainingSessionInput & { createdBy?: string | null },
  { rejectValue: string }
>("attendance/createTrainingSession", async (payload, { rejectWithValue }) => {
  try {
    const { createdBy, ...input } = payload;
    return await AttendanceService.createTrainingSession(input, createdBy);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to create training session",
    );
  }
});

export const saveAttendanceSheet = createAsyncThunk<
  void,
  {
    session: TrainingSessionRecord;
    records: AttendanceDraft[];
    markedBy?: string | null;
    playerNameMap?: Record<string, string>;
  },
  { rejectValue: string }
>("attendance/saveAttendanceSheet", async (payload, { rejectWithValue }) => {
  try {
    await AttendanceService.saveAttendanceRecords(
      payload.session,
      payload.records,
      payload.markedBy,
      payload.playerNameMap,
    );
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to save attendance",
    );
  }
});

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {
    setAttendanceLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setAttendanceError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setTrainingSessions(state, action: PayloadAction<TrainingSessionRecord[]>) {
      state.sessions = action.payload;
      state.loading = false;
    },
    setAttendanceRecords(state, action: PayloadAction<AttendanceRecord[]>) {
      state.records = action.payload;
      state.loading = false;
    },
    setAttendanceAnalytics(state, action: PayloadAction<AttendanceAnalytics>) {
      state.analytics = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTrainingSession.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createTrainingSession.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createTrainingSession.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to create training session";
      })
      .addCase(saveAttendanceSheet.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveAttendanceSheet.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveAttendanceSheet.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to save attendance";
      });
  },
});

export const {
  setAttendanceLoading,
  setAttendanceError,
  setTrainingSessions,
  setAttendanceRecords,
  setAttendanceAnalytics,
} = attendanceSlice.actions;

export default attendanceSlice.reducer;

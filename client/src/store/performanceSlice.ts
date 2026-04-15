import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import StatisticianService from "@/services/statisticianService";
import type { PerformanceSnapshot } from "@/types/sports";
import { emptyPerformanceSnapshot } from "@/types/sports";

interface PerformanceState extends PerformanceSnapshot {
  syncing: boolean;
  error: string | null;
}

const initialState: PerformanceState = {
  ...emptyPerformanceSnapshot,
  syncing: false,
  error: null,
};

export const syncPerformanceRecords = createAsyncThunk<
  void,
  PerformanceSnapshot,
  { rejectValue: string }
>("performance/syncPerformanceRecords", async (snapshot, { rejectWithValue }) => {
  try {
    await StatisticianService.syncPerformanceRecords(snapshot);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to sync performance records",
    );
  }
});

const performanceSlice = createSlice({
  name: "performance",
  initialState,
  reducers: {
    setPerformanceData(state, action: PayloadAction<PerformanceSnapshot>) {
      state.summaries = action.payload.summaries;
      state.leaderboard = action.payload.leaderboard;
      state.underperformers = action.payload.underperformers;
      state.averagePerformanceScore = action.payload.averagePerformanceScore;
      state.generatedAt = action.payload.generatedAt;
      state.error = null;
    },
    clearPerformanceData(state) {
      state.summaries = [];
      state.leaderboard = [];
      state.underperformers = [];
      state.averagePerformanceScore = 0;
      state.generatedAt = new Date(0).toISOString();
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncPerformanceRecords.pending, (state) => {
        state.syncing = true;
        state.error = null;
      })
      .addCase(syncPerformanceRecords.fulfilled, (state) => {
        state.syncing = false;
      })
      .addCase(syncPerformanceRecords.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload || "Failed to sync performance records";
      });
  },
});

export const { setPerformanceData, clearPerformanceData } =
  performanceSlice.actions;

export default performanceSlice.reducer;

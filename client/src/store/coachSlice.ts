import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import CoachService from "@/services/coachService";
import type {
  FormationRecord,
  MatchPreparationRecord,
  MatchSquadRecord,
  PlayerStatusRecord,
  TrainingPlanRecord,
} from "@/types/coach";

interface CoachState {
  squads: MatchSquadRecord[];
  formations: FormationRecord[];
  trainingPlans: TrainingPlanRecord[];
  playerStatuses: PlayerStatusRecord[];
  preparations: MatchPreparationRecord[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: CoachState = {
  squads: [],
  formations: [],
  trainingPlans: [],
  playerStatuses: [],
  preparations: [],
  loading: false,
  saving: false,
  error: null,
};

export const saveCoachMatchSquad = createAsyncThunk<
  void,
  {
    teamId: string;
    matchId: string;
    startingXI: string[];
    substitutes: string[];
    captainId?: string | null;
    notes?: string | null;
    createdBy?: string | null;
  },
  { rejectValue: string }
>("coach/saveMatchSquad", async (payload, { rejectWithValue }) => {
  try {
    const { teamId, ...data } = payload;
    await CoachService.saveMatchSquad(teamId, data);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to save match squad",
    );
  }
});

export const saveCoachFormation = createAsyncThunk<
  void,
  {
    teamId: string;
    name: string;
    shape: string;
    matchId?: string | null;
    slots: FormationRecord["slots"];
    notes?: string | null;
    createdBy?: string | null;
  },
  { rejectValue: string }
>("coach/saveFormation", async (payload, { rejectWithValue }) => {
  try {
    const { teamId, ...data } = payload;
    await CoachService.saveFormation(teamId, data);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to save formation",
    );
  }
});

export const saveCoachTrainingPlan = createAsyncThunk<
  void,
  {
    teamId: string;
    sessionId?: string | null;
    title: string;
    description: string;
    focusArea: string;
    playerEffort?: number | null;
    coachRating?: number | null;
    createdBy?: string | null;
  },
  { rejectValue: string }
>("coach/saveTrainingPlan", async (payload, { rejectWithValue }) => {
  try {
    const { teamId, ...data } = payload;
    await CoachService.saveTrainingPlan(teamId, data);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to save training plan",
    );
  }
});

export const saveCoachPlayerStatus = createAsyncThunk<
  void,
  {
    teamId: string;
    playerId: string;
    status: PlayerStatusRecord["status"];
    reason?: string | null;
    returnDate?: string | null;
    availabilityNote?: string | null;
    createdBy?: string | null;
  },
  { rejectValue: string }
>("coach/savePlayerStatus", async (payload, { rejectWithValue }) => {
  try {
    const { teamId, ...data } = payload;
    await CoachService.savePlayerStatus(teamId, data);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to save player status",
    );
  }
});

export const saveCoachMatchPreparation = createAsyncThunk<
  void,
  {
    teamId: string;
    matchId: string;
    squadReady: boolean;
    keyPlayers: string[];
    opponentNotes: string;
    checklistNotes?: string | null;
    createdBy?: string | null;
  },
  { rejectValue: string }
>("coach/saveMatchPreparation", async (payload, { rejectWithValue }) => {
  try {
    const { teamId, ...data } = payload;
    await CoachService.saveMatchPreparation(teamId, data);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to save match preparation",
    );
  }
});

export const createCoachTrainingSession = createAsyncThunk<
  string,
  {
    teamId: string;
    title: string;
    sessionDate: string;
    startTime: string;
    endTime?: string | null;
    venue: string;
    gracePeriodMinutes?: number;
    status?: "scheduled" | "completed" | "cancelled";
    createdBy?: string | null;
  },
  { rejectValue: string }
>("coach/createTrainingSession", async (payload, { rejectWithValue }) => {
  try {
    const { teamId, ...data } = payload;
    return await CoachService.createTrainingSession(teamId, {
      ...data,
      gracePeriodMinutes: data.gracePeriodMinutes ?? 10,
      status: data.status || "scheduled",
    });
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to create training session",
    );
  }
});

const coachSlice = createSlice({
  name: "coach",
  initialState,
  reducers: {
    setCoachLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setCoachError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setCoachSquads(state, action: PayloadAction<MatchSquadRecord[]>) {
      state.squads = action.payload;
      state.loading = false;
    },
    setCoachFormations(state, action: PayloadAction<FormationRecord[]>) {
      state.formations = action.payload;
      state.loading = false;
    },
    setCoachTrainingPlans(state, action: PayloadAction<TrainingPlanRecord[]>) {
      state.trainingPlans = action.payload;
      state.loading = false;
    },
    setCoachPlayerStatuses(state, action: PayloadAction<PlayerStatusRecord[]>) {
      state.playerStatuses = action.payload;
      state.loading = false;
    },
    setCoachPreparations(state, action: PayloadAction<MatchPreparationRecord[]>) {
      state.preparations = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveCoachMatchSquad.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveCoachMatchSquad.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveCoachMatchSquad.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to save match squad";
      })
      .addCase(saveCoachFormation.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveCoachFormation.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveCoachFormation.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to save formation";
      })
      .addCase(saveCoachTrainingPlan.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveCoachTrainingPlan.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveCoachTrainingPlan.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to save training plan";
      })
      .addCase(saveCoachPlayerStatus.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveCoachPlayerStatus.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveCoachPlayerStatus.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to save player status";
      })
      .addCase(saveCoachMatchPreparation.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveCoachMatchPreparation.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveCoachMatchPreparation.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to save match preparation";
      })
      .addCase(createCoachTrainingSession.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createCoachTrainingSession.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createCoachTrainingSession.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to create training session";
      });
  },
});

export const {
  setCoachLoading,
  setCoachError,
  setCoachSquads,
  setCoachFormations,
  setCoachTrainingPlans,
  setCoachPlayerStatuses,
  setCoachPreparations,
} = coachSlice.actions;

export default coachSlice.reducer;

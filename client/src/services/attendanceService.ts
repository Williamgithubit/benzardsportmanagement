import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { NotificationService } from "@/services/notificationService";
import type {
  AttendanceAnalytics,
  AttendanceRecord,
  AttendanceStatus,
  PlayerAttendanceSummary,
  PlayerRecord,
  SessionAttendanceSummary,
  TrainingSessionRecord,
} from "@/types/sports";
import { emptyAttendanceAnalytics } from "@/types/sports";
import {
  combineDateAndTime,
  sortByNewest,
  toDate,
  toIsoString,
  type FirestoreDateValue,
} from "@/utils/firestore";

const TRAINING_SESSIONS_COLLECTION = "trainingSessions";
const ATTENDANCE_COLLECTION = "attendance";

export interface TrainingSessionInput {
  title?: string;
  sessionDate: string;
  startTime: string;
  endTime?: string;
  venue: string;
  gracePeriodMinutes?: number;
  status?: TrainingSessionRecord["status"];
}

export interface AttendanceDraft {
  playerId: string;
  status: AttendanceStatus;
  arrivalTime?: string | null;
  manualArrivalTime?: string | null;
  notes?: string | null;
}

const normalizeTrainingSession = (
  id: string,
  data: Record<string, unknown>,
): TrainingSessionRecord => ({
  id,
  title:
    (typeof data.title === "string" && data.title.trim()) || "Training Session",
  sessionDate:
    (typeof data.sessionDate === "string" && data.sessionDate) ||
    new Date().toISOString().slice(0, 10),
  startTime: (typeof data.startTime === "string" && data.startTime) || "09:00",
  endTime: typeof data.endTime === "string" ? data.endTime : null,
  venue: (typeof data.venue === "string" && data.venue.trim()) || "TBD",
  gracePeriodMinutes:
    typeof data.gracePeriodMinutes === "number" ? data.gracePeriodMinutes : 10,
  status:
    data.status === "completed" || data.status === "cancelled"
      ? data.status
      : "scheduled",
  createdAt: toIsoString(data.createdAt as FirestoreDateValue),
  updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
  createdBy: typeof data.createdBy === "string" ? data.createdBy : null,
});

const normalizeAttendanceRecord = (
  id: string,
  data: Record<string, unknown>,
): AttendanceRecord => ({
  id,
  sessionId: typeof data.sessionId === "string" ? data.sessionId : "",
  playerId: typeof data.playerId === "string" ? data.playerId : "",
  status:
    data.status === "present" ||
    data.status === "absent" ||
    data.status === "late" ||
    data.status === "excused"
      ? data.status
      : "absent",
  arrivalTime: toIsoString(data.arrivalTime as FirestoreDateValue),
  manualArrivalTime: toIsoString(data.manualArrivalTime as FirestoreDateValue),
  autoDetectedLate: Boolean(data.autoDetectedLate),
  notes: typeof data.notes === "string" ? data.notes : null,
  createdAt: toIsoString(data.createdAt as FirestoreDateValue),
  updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
  markedBy: typeof data.markedBy === "string" ? data.markedBy : null,
});

const resolveAttendanceStatus = (
  session: TrainingSessionRecord,
  draft: AttendanceDraft,
): Pick<
  AttendanceRecord,
  "status" | "arrivalTime" | "manualArrivalTime" | "autoDetectedLate" | "notes"
> => {
  const candidateArrival = draft.manualArrivalTime || draft.arrivalTime || null;
  const arrivalDate = toDate(candidateArrival);
  const sessionStart = combineDateAndTime(
    session.sessionDate,
    session.startTime,
  );
  const lateThreshold = new Date(
    sessionStart.getTime() + session.gracePeriodMinutes * 60_000,
  );

  const notes = draft.notes?.trim() || null;

  if (draft.status === "absent" || draft.status === "excused") {
    return {
      status: draft.status,
      arrivalTime: null,
      manualArrivalTime: null,
      autoDetectedLate: false,
      notes,
    };
  }

  const arrivalTime = arrivalDate
    ? arrivalDate.toISOString()
    : new Date().toISOString();
  const manualArrivalTime = draft.manualArrivalTime
    ? toIsoString(draft.manualArrivalTime)
    : null;
  const isLate =
    draft.status === "late" || new Date(arrivalTime) > lateThreshold;

  return {
    status: isLate ? "late" : "present",
    arrivalTime,
    manualArrivalTime,
    autoDetectedLate: isLate && draft.status !== "late",
    notes,
  };
};

const buildPlayerAttendanceSummary = (
  player: PlayerRecord,
  records: AttendanceRecord[],
): PlayerAttendanceSummary => {
  const presentCount = records.filter(
    (record) => record.status === "present",
  ).length;
  const absentCount = records.filter(
    (record) => record.status === "absent",
  ).length;
  const lateCount = records.filter((record) => record.status === "late").length;
  const excusedCount = records.filter(
    (record) => record.status === "excused",
  ).length;
  const sessionsTracked = records.length;
  const attendanceRate = sessionsTracked
    ? Math.round(
        ((presentCount + lateCount + excusedCount) / sessionsTracked) * 100,
      )
    : 0;

  return {
    playerId: player.id,
    playerName: player.fullName,
    position: player.position,
    sessionsTracked,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    attendanceRate,
    lastStatus: records.sort(sortByNewest)[0]?.status,
  };
};

const buildSessionAttendanceSummary = (
  session: TrainingSessionRecord,
  records: AttendanceRecord[],
): SessionAttendanceSummary => {
  const presentCount = records.filter(
    (record) => record.status === "present",
  ).length;
  const absentCount = records.filter(
    (record) => record.status === "absent",
  ).length;
  const lateCount = records.filter((record) => record.status === "late").length;
  const excusedCount = records.filter(
    (record) => record.status === "excused",
  ).length;
  const total = records.length;
  const attendanceRate = total
    ? Math.round(((presentCount + lateCount + excusedCount) / total) * 100)
    : 0;

  return {
    sessionId: session.id,
    title: session.title,
    sessionDate: session.sessionDate,
    venue: session.venue,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    attendanceRate,
  };
};

export const buildAttendanceAnalytics = (
  sessions: TrainingSessionRecord[],
  records: AttendanceRecord[],
  players: PlayerRecord[],
): AttendanceAnalytics => {
  if (!players.length) {
    return {
      ...emptyAttendanceAnalytics,
      totalSessions: sessions.length,
    };
  }

  const summaryByPlayer = players
    .map((player) =>
      buildPlayerAttendanceSummary(
        player,
        records.filter((record) => record.playerId === player.id),
      ),
    )
    .sort((left, right) => right.attendanceRate - left.attendanceRate);

  const sessionBreakdown = sessions
    .map((session) =>
      buildSessionAttendanceSummary(
        session,
        records.filter((record) => record.sessionId === session.id),
      ),
    )
    .sort((left, right) => right.sessionDate.localeCompare(left.sessionDate));

  const totalTrackedSessions = summaryByPlayer.reduce(
    (total, summary) => total + summary.sessionsTracked,
    0,
  );
  const totalPositiveAttendances = summaryByPlayer.reduce(
    (total, summary) =>
      total + summary.presentCount + summary.lateCount + summary.excusedCount,
    0,
  );

  return {
    totalSessions: sessions.length,
    overallAttendanceRate: totalTrackedSessions
      ? Math.round((totalPositiveAttendances / totalTrackedSessions) * 100)
      : 0,
    byPlayer: summaryByPlayer,
    frequentAbsentees: [...summaryByPlayer]
      .sort((left, right) => right.absentCount - left.absentCount)
      .filter((summary) => summary.absentCount > 0)
      .slice(0, 5),
    mostConsistentPlayers: [...summaryByPlayer]
      .filter((summary) => summary.sessionsTracked > 0)
      .sort((left, right) => right.attendanceRate - left.attendanceRate)
      .slice(0, 5),
    sessionBreakdown,
  };
};

export const buildPlayerAttendanceHistory = (
  playerId: string,
  sessions: TrainingSessionRecord[],
  records: AttendanceRecord[],
) =>
  records
    .filter((record) => record.playerId === playerId)
    .map((record) => {
      const session = sessions.find((entry) => entry.id === record.sessionId);
      return {
        record,
        session,
      };
    })
    .sort((left, right) =>
      (right.session?.sessionDate || "").localeCompare(
        left.session?.sessionDate || "",
      ),
    );

export const AttendanceService = {
  subscribeToTrainingSessions(
    callback: (sessions: TrainingSessionRecord[]) => void,
    onError?: (error: unknown) => void,
  ) {
    return onSnapshot(
      collection(db, TRAINING_SESSIONS_COLLECTION),
      (snapshot) => {
        const sessions = snapshot.docs
          .map((entry) =>
            normalizeTrainingSession(
              entry.id,
              entry.data() as Record<string, unknown>,
            ),
          )
          .sort((left, right) => {
            const leftKey = `${left.sessionDate}T${left.startTime}`;
            const rightKey = `${right.sessionDate}T${right.startTime}`;
            return rightKey.localeCompare(leftKey);
          });

        callback(sessions);
      },
      (error) => {
        console.error("Failed to subscribe to training sessions:", error);
        callback([]);
        onError?.(error);
      },
    );
  },

  subscribeToAllAttendance(
    callback: (records: AttendanceRecord[]) => void,
    onError?: (error: unknown) => void,
  ) {
    return onSnapshot(
      collection(db, ATTENDANCE_COLLECTION),
      (snapshot) => {
        const records = snapshot.docs
          .map((entry) =>
            normalizeAttendanceRecord(
              entry.id,
              entry.data() as Record<string, unknown>,
            ),
          )
          .sort(sortByNewest);

        callback(records);
      },
      (error) => {
        console.error("Failed to subscribe to attendance:", error);
        callback([]);
        onError?.(error);
      },
    );
  },

  subscribeToRecentAttendance(
    callback: (records: AttendanceRecord[]) => void,
    onError?: (error: unknown) => void,
  ) {
    return onSnapshot(
      collection(db, ATTENDANCE_COLLECTION),
      (snapshot) => {
        const records = snapshot.docs
          .map((entry) =>
            normalizeAttendanceRecord(
              entry.id,
              entry.data() as Record<string, unknown>,
            ),
          )
          .sort(sortByNewest)
          .slice(0, 1000);

        callback(records);
      },
      (error) => {
        console.error("Failed to subscribe to recent attendance:", error);
        callback([]);
        onError?.(error);
      },
    );
  },

  subscribeToSessionAttendance(
    sessionId: string,
    callback: (records: AttendanceRecord[]) => void,
    onError?: (error: unknown) => void,
  ) {
    const attendanceQuery = query(
      collection(db, ATTENDANCE_COLLECTION),
      where("sessionId", "==", sessionId),
    );

    return onSnapshot(
      attendanceQuery,
      (snapshot) => {
        const records = snapshot.docs
          .map((entry) =>
            normalizeAttendanceRecord(
              entry.id,
              entry.data() as Record<string, unknown>,
            ),
          )
          .sort(sortByNewest);

        callback(records);
      },
      (error) => {
        console.error("Failed to subscribe to session attendance:", error);
        callback([]);
        onError?.(error);
      },
    );
  },

  async createTrainingSession(
    input: TrainingSessionInput,
    createdBy?: string | null,
  ) {
    const docRef = await addDoc(collection(db, TRAINING_SESSIONS_COLLECTION), {
      title: input.title?.trim() || "Training Session",
      sessionDate: input.sessionDate,
      startTime: input.startTime,
      endTime: input.endTime?.trim() || null,
      venue: input.venue.trim(),
      gracePeriodMinutes: input.gracePeriodMinutes ?? 10,
      status: input.status || "scheduled",
      createdBy: createdBy || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await NotificationService.createRoleNotifications(
      ["admin", "statistician"],
      {
        type: "system_alert",
        title: "Training session scheduled",
        message: `${input.venue} session set for ${input.sessionDate} at ${input.startTime}.`,
        data: {
          actionUrl: "/dashboard/statistician#attendance",
          actionLabel: "Open attendance",
          sessionId: docRef.id,
          priority: "medium",
        },
        dedupeKey: `training-session:${docRef.id}`,
      },
    );

    return docRef.id;
  },

  async saveAttendanceRecords(
    session: TrainingSessionRecord,
    drafts: AttendanceDraft[],
    markedBy?: string | null,
    playerNameMap: Record<string, string> = {},
  ) {
    const batch = writeBatch(db);

    drafts.forEach((draft) => {
      const normalized = resolveAttendanceStatus(session, draft);
      const recordRef = doc(
        db,
        ATTENDANCE_COLLECTION,
        `${session.id}_${draft.playerId}`,
      );

      batch.set(
        recordRef,
        {
          sessionId: session.id,
          playerId: draft.playerId,
          ...normalized,
          markedBy: markedBy || null,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );
    });

    await batch.commit();

    const absentPlayers = drafts
      .filter((draft) => draft.status === "absent")
      .map((draft) => draft.playerId);

    await Promise.all(
      absentPlayers.map(async (playerId) => {
        const attendanceSnapshot = await getDocs(
          query(
            collection(db, ATTENDANCE_COLLECTION),
            where("playerId", "==", playerId),
          ),
        );
        const history = attendanceSnapshot.docs
          .map((entry) =>
            normalizeAttendanceRecord(
              entry.id,
              entry.data() as Record<string, unknown>,
            ),
          )
          .sort(sortByNewest)
          .slice(0, 5);
        const absenceCount = history.filter(
          (record) => record.status === "absent",
        ).length;

        if (absenceCount < 3) {
          return;
        }

        const playerName = playerNameMap[playerId] || "A player";
        await NotificationService.createRoleNotifications(
          ["admin", "statistician"],
          {
            type: "attendance_alert",
            title: "Repeated absence detected",
            message: `${playerName} has been absent ${absenceCount} times across recent sessions.`,
            data: {
              actionUrl: "/dashboard/admin#attendance",
              actionLabel: "Review attendance",
              playerId,
              sessionId: session.id,
              priority: "high",
            },
            dedupeKey: `attendance-alert:${playerId}:${absenceCount}`,
          },
        );
      }),
    );
  },
};

export default AttendanceService;

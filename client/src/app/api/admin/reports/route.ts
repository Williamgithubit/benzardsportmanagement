import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import {
  getDateFromValue,
  requireAdminRequest,
  serializeFirestoreValue,
} from "@/lib/admin-route-utils";

export const runtime = "nodejs";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

type ReportDoc = Record<string, unknown> & {
  id: string;
  parentId?: string | null;
};

const formatDayKey = (date: Date) => date.toISOString().slice(0, 10);

const getStartOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const buildDayRange = (days: number) => {
  const today = getStartOfDay(new Date());

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today.getTime() - (days - index - 1) * DAY_IN_MS);

    return {
      date,
      key: formatDayKey(date),
    };
  });
};

const toCollectionDocs = async (name: string): Promise<ReportDoc[]> => {
  try {
    const snapshot = await getFirestore().collection(name).get();

    return snapshot.docs.map((entry) => ({
      id: entry.id,
      ...(serializeFirestoreValue(entry.data()) as Record<string, unknown>),
    }));
  } catch (error) {
    console.error(`Failed to load ${name} for admin reports:`, error);
    return [];
  }
};

const toCollectionGroupDocs = async (name: string): Promise<ReportDoc[]> => {
  try {
    const snapshot = await getFirestore().collectionGroup(name).get();

    return snapshot.docs.map((entry) => ({
      id: entry.id,
      parentId: entry.ref.parent.parent?.id ?? null,
      ...(serializeFirestoreValue(entry.data()) as Record<string, unknown>),
    }));
  } catch (error) {
    console.error(`Failed to load ${name} collection group for reports:`, error);
    return [];
  }
};

const getLastActivityDate = (user: ReportDoc) =>
  getDateFromValue(user.lastActiveAt) ??
  getDateFromValue(user.lastLoginAt) ??
  getDateFromValue(user.lastLogin);

const getSessionDurationInSeconds = (session: ReportDoc) => {
  if (typeof session.duration === "number" && Number.isFinite(session.duration)) {
    return session.duration;
  }

  const start = getDateFromValue(session.startTime);
  const end = getDateFromValue(session.endTime);

  if (!start || !end) {
    return 0;
  }

  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
};

export async function GET(request: NextRequest) {
  const authResult = await requireAdminRequest(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const [users, programs, events, tasks, sessions, enrollments, completions] =
      await Promise.all([
        toCollectionDocs("users"),
        toCollectionDocs("programs"),
        toCollectionDocs("events"),
        toCollectionDocs("tasks"),
        toCollectionGroupDocs("sessions"),
        toCollectionGroupDocs("enrollments"),
        toCollectionGroupDocs("completions"),
      ]);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * DAY_IN_MS);
    const monthAgo = new Date(now.getTime() - 30 * DAY_IN_MS);

    const activeUsers = users.filter((user) => {
      const lastActivity = getLastActivityDate(user);
      return Boolean(lastActivity && lastActivity >= monthAgo);
    }).length;

    const activePrograms = programs.filter(
      (program) => `${program.status ?? ""}`.toLowerCase() === "active",
    ).length;

    const upcomingEvents = events.filter((event) => {
      const startDate = getDateFromValue(event.startDate);
      const status = `${event.status ?? ""}`.toLowerCase();

      return Boolean(
        startDate &&
          startDate >= now &&
          status !== "cancelled" &&
          status !== "completed",
      );
    }).length;

    const completedTasks = tasks.filter(
      (task) => `${task.status ?? ""}`.toLowerCase() === "completed",
    ).length;

    const userGrowth = buildDayRange(30).map(({ date, key }) => {
      const endOfDay = new Date(date.getTime() + DAY_IN_MS - 1);

      const totalUsers = users.filter((user) => {
        const createdAt = getDateFromValue(user.createdAt);
        return Boolean(createdAt && createdAt <= endOfDay);
      }).length;

      const newUsers = users.filter((user) => {
        const createdAt = getDateFromValue(user.createdAt);
        return Boolean(createdAt && formatDayKey(createdAt) === key);
      }).length;

      return {
        date: key,
        totalUsers,
        newUsers,
      };
    });

    const taskCompletion = buildDayRange(30).map(({ date, key }) => {
      const completed = tasks.filter((task) => {
        const completedAt = getDateFromValue(task.completedAt);
        return (
          `${task.status ?? ""}`.toLowerCase() === "completed" &&
          Boolean(completedAt && formatDayKey(completedAt) === key)
        );
      }).length;

      const pending = tasks.filter((task) => {
        const status = `${task.status ?? ""}`.toLowerCase();
        const dueDate = getDateFromValue(task.dueDate);

        return (
          (status === "pending" || status === "in-progress") &&
          Boolean(dueDate && formatDayKey(dueDate) === key)
        );
      }).length;

      const overdue = tasks.filter((task) => {
        const status = `${task.status ?? ""}`.toLowerCase();
        const dueDate = getDateFromValue(task.dueDate);

        return (
          (status === "pending" || status === "in-progress") &&
          Boolean(dueDate && getStartOfDay(dueDate) < date)
        );
      }).length;

      return {
        date: key,
        completed,
        pending,
        overdue,
      };
    });

    const activeLastWeek = users.filter((user) => {
      const lastActivity = getLastActivityDate(user);
      return Boolean(lastActivity && lastActivity >= weekAgo);
    }).length;

    const activeLastMonth = users.filter((user) => {
      const lastActivity = getLastActivityDate(user);
      return Boolean(lastActivity && lastActivity >= monthAgo);
    }).length;

    const totalSessionDuration = sessions.reduce(
      (sum, session) => sum + getSessionDurationInSeconds(session),
      0,
    );

    const enrollmentsByProgram = new Map<string, number>();
    const completionsByProgram = new Map<string, number>();

    enrollments.forEach((entry) => {
      if (!entry.parentId) {
        return;
      }

      enrollmentsByProgram.set(
        entry.parentId,
        (enrollmentsByProgram.get(entry.parentId) || 0) + 1,
      );
    });

    completions.forEach((entry) => {
      if (!entry.parentId) {
        return;
      }

      completionsByProgram.set(
        entry.parentId,
        (completionsByProgram.get(entry.parentId) || 0) + 1,
      );
    });

    const programPerformance = [...programs]
      .sort((left, right) => {
        const leftCreatedAt =
          getDateFromValue(left.createdAt)?.getTime() ??
          getDateFromValue(left.updatedAt)?.getTime() ??
          0;
        const rightCreatedAt =
          getDateFromValue(right.createdAt)?.getTime() ??
          getDateFromValue(right.updatedAt)?.getTime() ??
          0;

        return rightCreatedAt - leftCreatedAt;
      })
      .map((program) => {
        const enrollmentsCount = enrollmentsByProgram.get(program.id) || 0;
        const completionsCount = completionsByProgram.get(program.id) || 0;
        const completionRate =
          enrollmentsCount > 0
            ? Math.round((completionsCount / enrollmentsCount) * 100)
            : 0;
        const rating =
          enrollmentsCount > 0
            ? Number(
                Math.min(5, Math.max(3, 3 + completionRate / 50)).toFixed(1),
              )
            : 0;

        return {
          id: program.id,
          name:
            (typeof program.name === "string" && program.name) ||
            (typeof program.title === "string" && program.title) ||
            "Unnamed Program",
          status:
            (typeof program.status === "string" && program.status) || "draft",
          startDate:
            getDateFromValue(program.startDate)?.toISOString() ??
            new Date().toISOString(),
          endDate:
            getDateFromValue(program.endDate)?.toISOString() ??
            new Date().toISOString(),
          enrollments: enrollmentsCount,
          completions: completionsCount,
          completionRate,
          rating,
          lastUpdated: new Date().toISOString(),
        };
      });

    const analytics = {
      totalUsers: users.length,
      activeUsers,
      totalPrograms: programs.length,
      activePrograms,
      totalEvents: events.length,
      upcomingEvents: upcomingEvents || events.length,
      completionRate: tasks.length
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0,
      completedTasks,
      totalTasks: tasks.length,
      userGrowth,
      taskCompletion,
      lastUpdated: new Date().toISOString(),
    };

    const engagementMetrics = {
      weeklyEngagement: users.length
        ? Math.min(100, Math.round((activeLastWeek / users.length) * 100))
        : 0,
      monthlyEngagement: users.length
        ? Math.min(100, Math.round((activeLastMonth / users.length) * 100))
        : 0,
      activeLastWeek,
      activeLastMonth,
      averageSessionDuration: sessions.length
        ? Math.round(totalSessionDuration / sessions.length / 60)
        : 0,
      totalSessions: sessions.length,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      analytics,
      engagementMetrics,
      programPerformance,
    });
  } catch (error) {
    console.error("Failed to load admin reports:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to load reports data",
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import {
  getDateFromValue,
  requireAdminRequest,
  serializeFirestoreValue,
} from "@/lib/admin-route-utils";

export const runtime = "nodejs";

const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

const toTimestamp = (value: unknown) => getDateFromValue(value)?.getTime() ?? 0;

const toAthleteName = (athlete: Record<string, unknown>) => {
  if (typeof athlete.name === "string" && athlete.name.trim()) {
    return athlete.name;
  }

  const fullName = [athlete.firstName, athlete.lastName]
    .filter(
      (part): part is string =>
        typeof part === "string" && part.trim().length > 0,
    )
    .join(" ")
    .trim();

  return fullName || "Unknown athlete";
};

const toCollectionDocs = async (
  name: string,
): Promise<Array<Record<string, unknown>>> => {
  try {
    const snapshot = await getFirestore().collection(name).get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(serializeFirestoreValue(doc.data()) as Record<string, unknown>),
    })) as Array<Record<string, unknown>>;
  } catch (error) {
    console.error(
      `Failed to load ${name} collection for admin dashboard:`,
      error,
    );
    return [] as Array<Record<string, unknown>>;
  }
};

export async function GET(request: NextRequest) {
  const authResult = await requireAdminRequest(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const limitParam = Number(
      request.nextUrl.searchParams.get("limit") || "10",
    );
    const limitCount =
      Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 10;
    const now = Date.now();

    const [
      users,
      programs,
      events,
      tasks,
      certificates,
      admissions,
      blogPosts,
      athletes,
      trainingSessions,
      contactSubmissions,
      contacts,
      messages,
    ] = await Promise.all([
      toCollectionDocs("users"),
      toCollectionDocs("programs"),
      toCollectionDocs("events"),
      toCollectionDocs("tasks"),
      toCollectionDocs("certificates"),
      toCollectionDocs("admissionApplications"),
      toCollectionDocs("blogPosts"),
      toCollectionDocs("athletes"),
      toCollectionDocs("trainingSessions"),
      toCollectionDocs("contactSubmissions"),
      toCollectionDocs("contacts"),
      toCollectionDocs("messages"),
    ]);

    const preferredContactCollection =
      contactSubmissions.length > 0
        ? contactSubmissions
        : contacts.length > 0
          ? contacts
          : messages;

    const completedTasks = tasks.filter(
      (task) => `${task.status ?? ""}`.toLowerCase() === "completed",
    ).length;

    const actualUpcomingEvents = events.filter((event) => {
      const startDate = getDateFromValue(event.startDate);
      const status = `${event.status ?? ""}`.toLowerCase();

      return (
        Boolean(startDate) &&
        startDate!.getTime() >= now &&
        status !== "completed" &&
        status !== "cancelled"
      );
    }).length;

    const activeTrainingPrograms = programs.filter((program) => {
      const type = `${program.type ?? ""}`.toLowerCase();
      const status = `${program.status ?? ""}`.toLowerCase();

      return type === "training" && (!status || status === "active");
    }).length;

    const scoutedAthletes = athletes.filter((athlete) => {
      const scoutingStatus =
        `${athlete.scoutingStatus ?? athlete.status ?? ""}`.toLowerCase();
      return scoutingStatus === "scouted";
    }).length;

    const recentRegistrations = users.filter((user) => {
      const createdAt = getDateFromValue(user.createdAt);
      return (
        Boolean(createdAt) && createdAt!.getTime() >= now - SEVEN_DAYS_IN_MS
      );
    }).length;

    const stats = {
      totalUsers: users.length,
      activePrograms: programs.filter(
        (program) => `${program.status ?? ""}`.toLowerCase() === "active",
      ).length,
      upcomingEvents: actualUpcomingEvents || events.length,
      tasksCompleted: tasks.length
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0,
      totalCertificates: certificates.length,
      totalAdmissions: admissions.length,
      totalBlogPosts: blogPosts.length,
      totalAthletes: athletes.length,
      scoutedAthletes,
      activeTrainingPrograms,
      recentRegistrations,
      contactSubmissions: preferredContactCollection.length,
    };

    const recentActivity = [
      ...users.map((user) => ({
        id: `user_${user.id}`,
        type: "user_registered",
        description: `New user ${(user.name as string) || (user.displayName as string) || (user.email as string) || "Unknown user"} registered`,
        timestamp:
          getDateFromValue(user.createdAt)?.toISOString() ??
          new Date().toISOString(),
      })),
      ...programs.map((program) => ({
        id: `program_${program.id}`,
        type: "program_created",
        description: `New program "${(program.title as string) || (program.name as string) || "Untitled"}" created`,
        timestamp:
          getDateFromValue(program.createdAt)?.toISOString() ??
          new Date().toISOString(),
      })),
      ...events.map((event) => ({
        id: `event_${event.id}`,
        type: "event_created",
        description: `New event "${(event.title as string) || (event.name as string) || "Untitled"}" scheduled`,
        timestamp:
          getDateFromValue(event.createdAt ?? event.startDate)?.toISOString() ??
          new Date().toISOString(),
      })),
      ...athletes.map((athlete) => ({
        id: `athlete_${athlete.id}`,
        type: "athlete_added",
        description: `New athlete ${toAthleteName(athlete)} added`,
        timestamp:
          getDateFromValue(athlete.createdAt)?.toISOString() ??
          new Date().toISOString(),
      })),
      ...trainingSessions.map((training) => ({
        id: `training_${training.id}`,
        type: "training_completed",
        description: `Training session updated: ${(training.title as string) || "Untitled session"}`,
        timestamp:
          getDateFromValue(
            training.createdAt ?? training.startDate,
          )?.toISOString() ?? new Date().toISOString(),
      })),
      ...preferredContactCollection.map((contact) => ({
        id: `contact_${contact.id}`,
        type: "contact_received",
        description: `New contact from ${(contact.name as string) || (contact.email as string) || "Anonymous"}${contact.subject ? `: ${contact.subject as string}` : ""}`,
        timestamp:
          getDateFromValue(contact.createdAt)?.toISOString() ??
          new Date().toISOString(),
      })),
    ]
      .sort(
        (left, right) =>
          toTimestamp(right.timestamp) - toTimestamp(left.timestamp),
      )
      .slice(0, limitCount);

    return NextResponse.json({
      success: true,
      stats,
      recentActivity,
    });
  } catch (error) {
    console.error("Failed to load admin dashboard data:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load dashboard data",
      },
      { status: 500 },
    );
  }
}

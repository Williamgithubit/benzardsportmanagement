import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  getDoc,
  doc,
  getCountFromServer,
  collectionGroup,
} from "firebase/firestore";
import { db } from "./firebase";

export interface DashboardStats {
  // General stats
  totalUsers: number;
  activePrograms: number;
  upcomingEvents: number;
  tasksCompleted: number;
  totalCertificates: number;
  totalAdmissions: number;
  totalBlogPosts: number;
  
  // Sports-specific stats
  totalAthletes: number;
  scoutedAthletes: number;
  activeTrainingPrograms: number;
  recentRegistrations: number;
  contactSubmissions: number;
}

export interface RecentActivity {
  id: string;
  type:
    | "user_registered"
    | "program_created"
    | "event_created"
    | "task_completed"
    | "athlete_added"
    | "training_completed"
    | "contact_received";
  description: string;
  timestamp: string;
  user?: string;
}

/**
 * Fetch dashboard statistics from Firebase
 */
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Fetch all stats in parallel for better performance
    const [
      usersCount,
      programsCount,
      eventsCount,
      tasksCount,
      certificatesCount,
      admissionsCount,
      blogPostsCount,
      athletesCount,
      scoutedAthletesCount,
      trainingProgramsCount,
      recentRegistrationsCount,
      contactSubmissionsCount
    ] = await Promise.all([
      getCountFromServer(collection(db, "users")).catch(() => ({ data: () => ({ count: 0 }) })),
      getCountFromServer(query(collection(db, "programs"), where("status", "==", "active"))).catch(() => ({ data: () => ({ count: 0 }) })),
      getCountFromServer(collection(db, "events")).catch(() => ({ data: () => ({ count: 0 }) })),
      getCountFromServer(collection(db, "tasks")).catch(() => ({ data: () => ({ count: 0 }) })),
      getCountFromServer(collection(db, "certificates")).catch(() => ({ data: () => ({ count: 0 }) })),
      getCountFromServer(collection(db, "admissionApplications")).catch(() => ({ data: () => ({ count: 0 }) })),
      // Get blog posts count
      getCountFromServer(collection(db, "blogPosts")).catch(() => ({ data: () => ({ count: 0 }) })),
      // Sports-specific counts
      getCountFromServer(collection(db, "athletes")).catch(() => ({ data: () => ({ count: 0 }) })),
      getCountFromServer(query(collection(db, "athletes"), where("status", "==", "scouted"))).catch(() => ({ data: () => ({ count: 0 }) })),
      getCountFromServer(query(collection(db, "programs"), where("type", "==", "training"))).catch(() => ({ data: () => ({ count: 0 }) })),
      getCountFromServer(query(collection(db, "users"), where("createdAt", ">", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))).catch(() => ({ data: () => ({ count: 0 }) })),
      // Try multiple possible collection names for contact messages
      getCountFromServer(collection(db, "contactSubmissions"))
        .catch(() => getCountFromServer(collection(db, "contacts")))
        .catch(() => getCountFromServer(collection(db, "messages")))
        .catch(() => ({ data: () => ({ count: 0 }) }))
    ]);

    try {
      // Calculate completed tasks percentage
      const completedTasks = await getCountFromServer(
        query(collection(db, "tasks"), where("status", "==", "completed"))
      );
      const tasksCompleted = tasksCount.data().count > 0 
        ? Math.round((completedTasks.data().count / tasksCount.data().count) * 100) 
        : 0;

      // Get events count - use simple query to avoid index issues
      let upcomingEventsCount = 0;
      try {
        const now = new Date();
        const upcomingEventsSnapshot = await getCountFromServer(
          query(
            collection(db, "events"),
            where("startDate", ">=", Timestamp.fromDate(now))
          )
        );
        upcomingEventsCount = upcomingEventsSnapshot.data().count;
        
        // If no upcoming events, show total events count instead
        if (upcomingEventsCount === 0) {
          const totalEventsSnapshot = await getCountFromServer(collection(db, "events"));
          upcomingEventsCount = totalEventsSnapshot.data().count;
        }
      } catch (error) {
        console.error("Error fetching upcoming events count:", error);
        // Fallback to total events count
        const totalEventsSnapshot = await getCountFromServer(collection(db, "events"));
        upcomingEventsCount = totalEventsSnapshot.data().count;
      }

      // Get recent registrations (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentRegistrations = await getCountFromServer(
        query(
          collection(db, "users"),
          where("createdAt", ">=", Timestamp.fromDate(sevenDaysAgo))
        )
      );

      // Get active training programs - simplified query
      let activeTrainingProgramsCount = 0;
      try {
        const activeTrainingPrograms = await getCountFromServer(
          query(
            collection(db, "programs"),
            where("type", "==", "training")
          )
        );
        activeTrainingProgramsCount = activeTrainingPrograms.data().count;
      } catch (error) {
        console.error("Error fetching training programs:", error);
        activeTrainingProgramsCount = 0;
      }

      const stats = {
        // General stats
        totalUsers: usersCount.data().count,
        activePrograms: programsCount.data().count,
        upcomingEvents: upcomingEventsCount,
        tasksCompleted,
        totalCertificates: certificatesCount.data().count,
        totalAdmissions: admissionsCount.data().count,
        totalBlogPosts: blogPostsCount.data().count,
        
        // Sports-specific stats
        totalAthletes: athletesCount.data().count,
        scoutedAthletes: scoutedAthletesCount.data().count,
        activeTrainingPrograms: activeTrainingProgramsCount,
        recentRegistrations: recentRegistrations.data().count,
        contactSubmissions: contactSubmissionsCount.data().count
      };
      
      console.log("Dashboard stats fetched successfully:", stats);
      return stats;
    } catch (error) {
      console.error("Error in dashboard stats calculation:", error);
      console.log("Error details:", {
        usersCount: usersCount?.data?.(),
        blogPostsCount: blogPostsCount?.data?.(),
        contactSubmissionsCount: contactSubmissionsCount?.data?.()
      });
      
      // Return partial data with zeros for failed queries
      return {
        totalUsers: usersCount?.data?.()?.count ?? 0,
        activePrograms: programsCount?.data?.()?.count ?? 0,
        upcomingEvents: 0,
        tasksCompleted: 0,
        totalCertificates: certificatesCount?.data?.()?.count ?? 0,
        totalAdmissions: admissionsCount?.data?.()?.count ?? 0,
        totalBlogPosts: blogPostsCount?.data?.()?.count ?? 0,
        totalAthletes: athletesCount?.data?.()?.count ?? 0,
        scoutedAthletes: scoutedAthletesCount?.data?.()?.count ?? 0,
        activeTrainingPrograms: 0,
        recentRegistrations: 0,
        contactSubmissions: contactSubmissionsCount?.data?.()?.count ?? 0
      };
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw new Error("Failed to fetch dashboard statistics");
  }
};

/**
 * Fetch recent activity from Firebase including sports-specific activities
 */
export const fetchRecentActivity = async (
  limitCount: number = 10
): Promise<RecentActivity[]> => {
  try {
    // Fetch all activity types in parallel
    const [
      recentUsers,
      recentPrograms,
      recentEvents,
      recentAthletes,
      recentTrainings,
      recentContacts
    ] = await Promise.all([
      // Recent user registrations
      getDocs(
        query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          limit(3)
        )
      ).catch(() => ({ docs: [] })),
      // Recent programs
      getDocs(
        query(
          collection(db, "programs"),
          orderBy("createdAt", "desc"),
          limit(3)
        )
      ).catch(() => ({ docs: [] })),
      // Recent events
      getDocs(
        query(
          collection(db, "events"),
          orderBy("startDate", "desc"),
          limit(3)
        )
      ).catch(() => ({ docs: [] })),
      // Recent athletes
      getDocs(
        query(
          collection(db, "athletes"),
          orderBy("createdAt", "desc"),
          limit(3)
        )
      ).catch(() => ({ docs: [] })),
      // Recent training sessions - simplified to avoid orderBy + where issues
      getDocs(
        query(
          collection(db, "trainingSessions"),
          orderBy("startDate", "desc"),
          limit(3)
        )
      ).catch(() => ({ docs: [] })),
      // Recent contact form submissions
      getDocs(
        query(
          collection(db, "contactSubmissions"),
          orderBy("createdAt", "desc"),
          limit(3)
        )
      ).catch(() => ({ docs: [] }))
    ]);

    const activities: RecentActivity[] = [];

    // Process user registrations
    recentUsers.docs.forEach(doc => {
      const data = doc.data();
      activities.push({
        id: `user_${doc.id}`,
        type: "user_registered",
        description: `New user ${data.name || data.email} registered`,
        timestamp: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        user: data.name || data.email
      });
    });

    // Process programs
    recentPrograms.docs.forEach(doc => {
      const data = doc.data();
      activities.push({
        id: `program_${doc.id}`,
        type: "program_created",
        description: `New program "${data.title || data.name}" created`,
        timestamp: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });

    // Process events
    recentEvents.docs.forEach(doc => {
      const data = doc.data();
      activities.push({
        id: `event_${doc.id}`,
        type: "event_created",
        description: `New event "${data.title || data.name}" scheduled`,
        timestamp: data.startDate?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });

    // Process athletes
    recentAthletes.docs.forEach(doc => {
      const data = doc.data();
      activities.push({
        id: `athlete_${doc.id}`,
        type: "athlete_added",
        description: `New athlete ${data.firstName} ${data.lastName} added`,
        timestamp: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });

    // Process training sessions
    recentTrainings.docs.forEach(doc => {
      const data = doc.data();
      activities.push({
        id: `training_${doc.id}`,
        type: "training_completed",
        description: `Training session completed: ${data.title || 'Untitled'}`,
        timestamp: data.startDate?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });

    // Process contact form submissions
    recentContacts.docs.forEach(doc => {
      const data = doc.data();
      activities.push({
        id: `contact_${doc.id}`,
        type: "contact_received",
        description: `New contact from ${data.name || 'Anonymous'}: ${data.subject || 'No subject'}`,
        timestamp: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });

    // Sort all activities by timestamp (newest first) and limit the results
    return activities
      .sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return []; // Return empty array on error to prevent UI breakage
  }
};

/**
 * Get formatted time ago string
 */
export const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return time.toLocaleDateString();
};

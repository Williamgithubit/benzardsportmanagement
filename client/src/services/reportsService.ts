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
  DocumentData,
  QueryDocumentSnapshot,
  onSnapshot,
  Unsubscribe
} from "firebase/firestore";
import { db } from "./firebase";
import { startOfWeek, endOfWeek, subDays, format } from 'date-fns';

// Types for Firestore documents
interface UserDoc {
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  status: 'active' | 'inactive' | 'suspended';
}

interface ProgramDoc {
  name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  startDate: Timestamp;
  endDate: Timestamp;
  createdAt: Timestamp;
}

interface EventDoc {
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

interface TaskDoc {
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate: Timestamp;
  completedAt?: Timestamp;
}

interface SessionDoc {
  startTime: Timestamp;
  endTime: Timestamp;
  userId: string;
  duration: number; // in seconds
}

export interface UserGrowthData {
  date: string;
  totalUsers: number;
  newUsers: number;
}

export interface TaskCompletionData {
  date: string;
  completed: number;
  pending: number;
  overdue: number;
}

export interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalPrograms: number;
  activePrograms: number;
  totalEvents: number;
  upcomingEvents: number;
  completionRate: number;
  completedTasks: number;
  totalTasks: number;
  userGrowth: UserGrowthData[];
  taskCompletion: TaskCompletionData[];
  lastUpdated: Date;
}

export interface ProgramPerformance {
  id: string;
  name: string;
  status: string;
  startDate: Date;
  endDate: Date;
  enrollments: number;
  completions: number;
  completionRate: number;
  rating: number;
  lastUpdated: Date;
}

export interface UserEngagementMetrics {
  weeklyEngagement: number;
  monthlyEngagement: number;
  activeLastWeek: number;
  activeLastMonth: number;
  averageSessionDuration: number; // in minutes
  totalSessions: number;
  lastUpdated: Date;
}

// Helper function to safely get data from Firestore document
const getDocData = <T>(doc: QueryDocumentSnapshot<DocumentData>): T => ({
  id: doc.id,
  ...doc.data()
} as T);

// Helper function to calculate days between dates
const getDaysArray = (start: Date, end: Date): Date[] => {
  const arr: Date[] = [];
  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    arr.push(new Date(dt));
  }
  return arr;
};

// Cache for real-time subscriptions
const subscriptions = new Map<string, Unsubscribe>();

/**
 * Get analytics data for reports dashboard with real-time updates
 */
export const getAnalyticsData = (
  callback?: (data: AnalyticsData) => void
): Promise<AnalyticsData> | Unsubscribe => {
  const fetchData = async (): Promise<AnalyticsData> => {
    try {
      const [
        usersCount,
        activeUsersCount,
        programsCount,
        activeProgramsCount,
        eventsCount,
        upcomingEventsCount,
        tasksCount,
        completedTasksCount,
      ] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(query(
          collection(db, 'users'),
          where('lastActiveAt', '>=', Timestamp.fromDate(subDays(new Date(), 30))),
          where('status', '==', 'active')
        )),
        getCountFromServer(collection(db, 'programs')),
        getCountFromServer(query(
          collection(db, 'programs'),
          where('status', '==', 'active')
        )),
        getCountFromServer(collection(db, 'events')),
        getCountFromServer(query(
          collection(db, 'events'),
          where('startDate', '>=', Timestamp.fromDate(new Date()))
        )),
        getCountFromServer(collection(db, 'tasks')),
        getCountFromServer(query(
          collection(db, 'tasks'),
          where('status', '==', 'completed')
        )),
      ]);

      // Calculate user growth data (last 30 days)
      const userGrowthPromises = getDaysArray(subDays(new Date(), 29), new Date())
        .map(async (date) => {
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);

          const [totalUsers, newUsers] = await Promise.all([
            getCountFromServer(query(
              collection(db, 'users'),
              where('createdAt', '<=', Timestamp.fromDate(endOfDay))
            )),
            getCountFromServer(query(
              collection(db, 'users'),
              where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
              where('createdAt', '<=', Timestamp.fromDate(endOfDay))
            ))
          ]);

          return {
            date: format(date, 'yyyy-MM-dd'),
            totalUsers: totalUsers.data().count,
            newUsers: newUsers.data().count,
          };
        });

      const userGrowth = await Promise.all(userGrowthPromises);

      // Calculate task completion trends (last 30 days)
      const taskCompletionPromises = getDaysArray(subDays(new Date(), 29), new Date())
        .map(async (date) => {
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);

          const [completed, pending, overdue] = await Promise.all([
            getCountFromServer(query(
              collection(db, 'tasks'),
              where('status', '==', 'completed'),
              where('completedAt', '>=', Timestamp.fromDate(startOfDay)),
              where('completedAt', '<=', Timestamp.fromDate(endOfDay))
            )),
            getCountFromServer(query(
              collection(db, 'tasks'),
              where('status', 'in', ['pending', 'in-progress']),
              where('dueDate', '>=', Timestamp.fromDate(startOfDay)),
              where('dueDate', '<=', Timestamp.fromDate(endOfDay))
            )),
            getCountFromServer(query(
              collection(db, 'tasks'),
              where('status', 'in', ['pending', 'in-progress']),
              where('dueDate', '<', Timestamp.fromDate(startOfDay))
            ))
          ]);

          return {
            date: format(date, 'yyyy-MM-dd'),
            completed: completed.data().count,
            pending: pending.data().count,
            overdue: overdue.data().count,
          };
        });

      const taskCompletion = await Promise.all(taskCompletionPromises);

      const result: AnalyticsData = {
        totalUsers: usersCount.data().count,
        activeUsers: activeUsersCount.data().count,
        totalPrograms: programsCount.data().count,
        activePrograms: activeProgramsCount.data().count,
        totalEvents: eventsCount.data().count,
        upcomingEvents: upcomingEventsCount.data().count,
        totalTasks: tasksCount.data().count,
        completedTasks: completedTasksCount.data().count,
        completionRate: tasksCount.data().count > 0 
          ? Math.round((completedTasksCount.data().count / tasksCount.data().count) * 100)
          : 0,
        userGrowth,
        taskCompletion,
        lastUpdated: new Date(),
      };

      return result;
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw new Error('Failed to fetch analytics data');
    }
  };

  if (callback) {
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      query(collectionGroup(db, 'analytics'), limit(1)),
      async () => {
        try {
          const data = await fetchData();
          callback(data);
        } catch (error) {
          console.error('Error in real-time update:', error);
        }
      },
      (error) => {
        console.error('Real-time listener error:', error);
      }
    );

    // Store subscription for cleanup
    const subscriptionId = `analytics-${Date.now()}`;
    subscriptions.set(subscriptionId, unsubscribe);

    // Initial data fetch
    fetchData().then(callback).catch(console.error);

    // Return cleanup function
    return () => {
      const unsub = subscriptions.get(subscriptionId);
      if (unsub) {
        unsub();
        subscriptions.delete(subscriptionId);
      }
    };
  }

  // Return promise for one-time fetch
  return fetchData();
};

/**
 * Get user engagement metrics with real-time updates
 */
export const getUserEngagementMetrics = (
  callback?: (metrics: UserEngagementMetrics) => void
): Promise<UserEngagementMetrics> | Unsubscribe => {
  const fetchData = async (): Promise<UserEngagementMetrics> => {
    try {
      const now = new Date();
      const weekAgo = subDays(now, 7);
      const monthAgo = subDays(now, 30);

      // Get active users
      const [activeThisWeek, activeThisMonth] = await Promise.all([
        getCountFromServer(query(
          collection(db, 'users'),
          where('lastActiveAt', '>=', Timestamp.fromDate(weekAgo)),
          where('status', '==', 'active')
        )),
        getCountFromServer(query(
          collection(db, 'users'),
          where('lastActiveAt', '>=', Timestamp.fromDate(monthAgo)),
          where('status', '==', 'active')
        )),
      ]);

      // Get session data
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('endTime', '>=', Timestamp.fromDate(monthAgo)),
        orderBy('endTime', 'desc')
      );
      
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = sessionsSnapshot.docs.map(doc => getDocData<SessionDoc>(doc));
      
      // Calculate session metrics
      const totalSessions = sessions.length;
      const totalDuration = sessions.reduce((sum, session) => {
        return sum + (session.duration || 0);
      }, 0);
      
      const averageSessionDuration = totalSessions > 0 
        ? Math.round((totalDuration / totalSessions) / 60) // Convert to minutes
        : 0;

      // Calculate engagement percentages
      const totalUsers = (await getCountFromServer(collection(db, 'users'))).data().count;
      const weeklyEngagement = totalUsers > 0 
        ? Math.min(100, Math.round((activeThisWeek.data().count / totalUsers) * 100))
        : 0;
      
      const monthlyEngagement = totalUsers > 0
        ? Math.min(100, Math.round((activeThisMonth.data().count / totalUsers) * 100))
        : 0;

      const result: UserEngagementMetrics = {
        weeklyEngagement,
        monthlyEngagement,
        activeLastWeek: activeThisWeek.data().count,
        activeLastMonth: activeThisMonth.data().count,
        averageSessionDuration,
        totalSessions,
        lastUpdated: new Date(),
      };

      return result;
    } catch (error) {
      console.error('Error fetching user engagement metrics:', error);
      throw new Error('Failed to fetch user engagement metrics');
    }
  };

  if (callback) {
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      query(collectionGroup(db, 'sessions'), limit(1)),
      async () => {
        try {
          const data = await fetchData();
          callback(data);
        } catch (error) {
          console.error('Error in real-time update:', error);
        }
      },
      (error) => {
        console.error('Real-time listener error:', error);
      }
    );

    // Store subscription for cleanup
    const subscriptionId = `engagement-${Date.now()}`;
    subscriptions.set(subscriptionId, unsubscribe);

    // Initial data fetch
    fetchData().then(callback).catch(console.error);

    // Return cleanup function
    return () => {
      const unsub = subscriptions.get(subscriptionId);
      if (unsub) {
        unsub();
        subscriptions.delete(subscriptionId);
      }
    };
  }

  // Return promise for one-time fetch
  return fetchData();
};

/**
 * Get program performance metrics with real-time updates
 */
export const getProgramPerformanceMetrics = (
  callback?: (metrics: ProgramPerformance[]) => void
): Promise<ProgramPerformance[]> | Unsubscribe => {
  const fetchData = async (): Promise<ProgramPerformance[]> => {
    try {
      // Get all programs
      const programsQuery = query(
        collection(db, 'programs'),
        orderBy('createdAt', 'desc')
      );
      
      // Get all enrollments and completions
      const [programsSnapshot, enrollmentsSnapshot, completionsSnapshot] = await Promise.all([
        getDocs(programsQuery),
        getDocs(collectionGroup(db, 'enrollments')),
        getDocs(collectionGroup(db, 'completions'))
      ]);

      // Index enrollments and completions by program ID
      const enrollmentsByProgram = new Map<string, number>();
      const completionsByProgram = new Map<string, number>();

      enrollmentsSnapshot.forEach(doc => {
        const programId = doc.ref.parent.parent?.id;
        if (programId) {
          enrollmentsByProgram.set(programId, (enrollmentsByProgram.get(programId) || 0) + 1);
        }
      });

      completionsSnapshot.forEach(doc => {
        const programId = doc.ref.parent.parent?.id;
        if (programId) {
          completionsByProgram.set(programId, (completionsByProgram.get(programId) || 0) + 1);
        }
      });

      // Process programs
      const programs = programsSnapshot.docs.map(doc => {
        const program = getDocData<ProgramDoc>(doc);
        const enrollments = enrollmentsByProgram.get(doc.id) || 0;
        const completions = completionsByProgram.get(doc.id) || 0;
        
        return {
          id: doc.id,
          name: program.name || 'Unnamed Program',
          status: program.status || 'draft',
          startDate: program.startDate?.toDate() || new Date(),
          endDate: program.endDate?.toDate() || new Date(),
          enrollments,
          completions,
          completionRate: enrollments > 0 ? Math.round((completions / enrollments) * 100) : 0,
          rating: 0, // You can implement rating logic if needed
          lastUpdated: new Date(),
        };
      });

      return programs;
    } catch (error) {
      console.error('Error fetching program performance metrics:', error);
      throw new Error('Failed to fetch program performance metrics');
    }
  };

  if (callback) {
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      query(collectionGroup(db, 'programs'), limit(1)),
      async () => {
        try {
          const data = await fetchData();
          callback(data);
        } catch (error) {
          console.error('Error in real-time update:', error);
        }
      },
      (error) => {
        console.error('Real-time listener error:', error);
      }
    );

    // Store subscription for cleanup
    const subscriptionId = `programs-${Date.now()}`;
    subscriptions.set(subscriptionId, unsubscribe);

    // Initial data fetch
    fetchData().then(callback).catch(console.error);

    // Return cleanup function
    return () => {
      const unsub = subscriptions.get(subscriptionId);
      if (unsub) {
        unsub();
        subscriptions.delete(subscriptionId);
      }
    };
  }

  // Return promise for one-time fetch
  return fetchData();
};

// Clean up all subscriptions when the module is unloaded
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    subscriptions.forEach(unsubscribe => unsubscribe());
    subscriptions.clear();
  });
}

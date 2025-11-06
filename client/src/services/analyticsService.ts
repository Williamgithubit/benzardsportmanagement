import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "./firebase";

export interface RegionalData {
  name: string;
  athletes: number;
  events: number;
}

export interface LevelData {
  name: string;
  value: number;
  color: string;
}

export interface GrowthData {
  month: string;
  athletes: number;
  events: number;
}

export interface AnalyticsMetrics {
  eventAttendanceRate: number;
  athletesScouted: number;
  trainingCompletion: number;
  activePrograms: number;
}

/**
 * Fetch regional distribution of athletes and events
 */
export const fetchRegionalData = async (): Promise<RegionalData[]> => {
  try {
    const athletesSnapshot = await getDocs(collection(db, "athletes"));
    const eventsSnapshot = await getDocs(collection(db, "events"));

    // Count by location
    const locationCounts: { [key: string]: { athletes: number; events: number } } = {};

    athletesSnapshot.forEach((doc) => {
      const data = doc.data();
      const location = data.location || "Unknown";
      if (!locationCounts[location]) {
        locationCounts[location] = { athletes: 0, events: 0 };
      }
      locationCounts[location].athletes++;
    });

    eventsSnapshot.forEach((doc) => {
      const data = doc.data();
      const location = data.location || "Unknown";
      if (!locationCounts[location]) {
        locationCounts[location] = { athletes: 0, events: 0 };
      }
      locationCounts[location].events++;
    });

    // Convert to array and sort by athlete count
    return Object.entries(locationCounts)
      .map(([name, counts]) => ({
        name,
        athletes: counts.athletes,
        events: counts.events,
      }))
      .sort((a, b) => b.athletes - a.athletes)
      .slice(0, 10); // Top 10 regions
  } catch (error) {
    console.error("Error fetching regional data:", error);
    return [];
  }
};

/**
 * Fetch athlete distribution by level
 */
export const fetchLevelData = async (): Promise<LevelData[]> => {
  try {
    const athletesSnapshot = await getDocs(collection(db, "athletes"));

    const levelCounts: { [key: string]: number } = {
      Grassroots: 0,
      "Semi-Pro": 0,
      Professional: 0,
    };

    athletesSnapshot.forEach((doc) => {
      const data = doc.data();
      const level = data.level || "Grassroots";
      if (levelCounts[level] !== undefined) {
        levelCounts[level]++;
      }
    });

    return [
      { name: "Grassroots", value: levelCounts.Grassroots, color: "#8884d8" },
      { name: "Semi-Pro", value: levelCounts["Semi-Pro"], color: "#82ca9d" },
      { name: "Professional", value: levelCounts.Professional, color: "#ffc658" },
    ];
  } catch (error) {
    console.error("Error fetching level data:", error);
    return [
      { name: "Grassroots", value: 0, color: "#8884d8" },
      { name: "Semi-Pro", value: 0, color: "#82ca9d" },
      { name: "Professional", value: 0, color: "#ffc658" },
    ];
  }
};

/**
 * Fetch growth data for the last 6 months
 */
export const fetchGrowthData = async (): Promise<GrowthData[]> => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const athletesSnapshot = await getDocs(
      query(
        collection(db, "athletes"),
        where("createdAt", ">=", Timestamp.fromDate(sixMonthsAgo))
      )
    );

    const eventsSnapshot = await getDocs(
      query(
        collection(db, "events"),
        where("createdAt", ">=", Timestamp.fromDate(sixMonthsAgo))
      )
    );

    // Initialize monthly counts
    const monthlyData: { [key: string]: { athletes: number; events: number } } = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthNames[date.getMonth()]}`;
      monthlyData[monthKey] = { athletes: 0, events: 0 };
    }

    // Count athletes by month
    athletesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt) {
        const date = data.createdAt.toDate();
        const monthKey = monthNames[date.getMonth()];
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].athletes++;
        }
      }
    });

    // Count events by month
    eventsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt) {
        const date = data.createdAt.toDate();
        const monthKey = monthNames[date.getMonth()];
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].events++;
        }
      }
    });

    // Convert to cumulative counts
    let cumulativeAthletes = 0;
    let cumulativeEvents = 0;

    return Object.entries(monthlyData).map(([month, counts]) => {
      cumulativeAthletes += counts.athletes;
      cumulativeEvents += counts.events;
      return {
        month,
        athletes: cumulativeAthletes,
        events: cumulativeEvents,
      };
    });
  } catch (error) {
    console.error("Error fetching growth data:", error);
    return [];
  }
};

/**
 * Fetch key analytics metrics
 */
export const fetchAnalyticsMetrics = async (): Promise<AnalyticsMetrics> => {
  try {
    const [
      totalEvents,
      totalAthletes,
      scoutedAthletes,
      activePrograms,
    ] = await Promise.all([
      getCountFromServer(collection(db, "events")),
      getCountFromServer(collection(db, "athletes")),
      getCountFromServer(
        query(collection(db, "athletes"), where("status", "==", "scouted"))
      ),
      getCountFromServer(
        query(collection(db, "programs"), where("status", "==", "active"))
      ),
    ]);

    // Calculate event attendance rate (mock for now - would need actual attendance data)
    const eventAttendanceRate = totalEvents.data().count > 0 ? 85 : 0;

    // Calculate scouted percentage
    const totalAthletesCount = totalAthletes.data().count;
    const scoutedCount = scoutedAthletes.data().count;
    const athletesScouted = totalAthletesCount > 0
      ? Math.round((scoutedCount / totalAthletesCount) * 100)
      : 0;

    // Training completion rate (mock for now - would need actual training data)
    const trainingCompletion = 75;

    return {
      eventAttendanceRate,
      athletesScouted,
      trainingCompletion,
      activePrograms: activePrograms.data().count,
    };
  } catch (error) {
    console.error("Error fetching analytics metrics:", error);
    return {
      eventAttendanceRate: 0,
      athletesScouted: 0,
      trainingCompletion: 0,
      activePrograms: 0,
    };
  }
};

/**
 * Fetch all analytics data at once
 */
export const fetchAllAnalytics = async () => {
  try {
    const [regionalData, levelData, growthData, metrics] = await Promise.all([
      fetchRegionalData(),
      fetchLevelData(),
      fetchGrowthData(),
      fetchAnalyticsMetrics(),
    ]);

    return {
      regionalData,
      levelData,
      growthData,
      metrics,
    };
  } catch (error) {
    console.error("Error fetching all analytics:", error);
    throw error;
  }
};

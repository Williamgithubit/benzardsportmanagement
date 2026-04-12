import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/services/firebase";

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  capacity: number;
  registrations: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  category:
    | "tournament"
    | "training_camp"
    | "community_outreach"
    | "trial"
    | "match"
    | "clinic"
    | "other";
  price: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventDoc {
  title: string;
  description: string;
  startDate: Timestamp;
  endDate: Timestamp;
  location: string;
  capacity: number;
  registrations: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  category:
    | "tournament"
    | "training_camp"
    | "community_outreach"
    | "trial"
    | "match"
    | "clinic"
    | "other";
  price: number;
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateEventData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  capacity: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  category:
    | "tournament"
    | "training_camp"
    | "community_outreach"
    | "trial"
    | "match"
    | "clinic"
    | "other";
  price: number;
  isPublic: boolean;
}

export type UpdateEventData = Partial<CreateEventData>;

// Utility function to convert Firestore Timestamp to Date
const toDate = (
  timestamp: Timestamp | Date | string | null | undefined
): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  // Type guard to check if it's a Timestamp object
  if (
    typeof timestamp === "object" &&
    timestamp !== null &&
    "toDate" in timestamp &&
    typeof timestamp.toDate === "function"
  ) {
    return (timestamp as Timestamp).toDate();
  }
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
};

// Convert Firestore document to Event interface
const convertDocToEvent = (id: string, doc: EventDoc): Event => ({
  id,
  title: doc.title,
  description: doc.description,
  startDate: toDate(doc.startDate),
  endDate: toDate(doc.endDate),
  location: doc.location,
  capacity: doc.capacity,
  registrations: doc.registrations || 0,
  status: doc.status,
  category: doc.category,
  price: doc.price || 0,
  isPublic: doc.isPublic,
  createdAt: toDate(doc.createdAt),
  updatedAt: toDate(doc.updatedAt),
});

// Get all events
export const getEvents = async (): Promise<Event[]> => {
  try {
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, orderBy("startDate", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) =>
      convertDocToEvent(doc.id, doc.data() as EventDoc)
    );
  } catch (error) {
    console.error("Error fetching events:", error);
    throw new Error("Failed to fetch events");
  }
};

// Create a new event
export const createEvent = async (
  eventData: CreateEventData
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docData: EventDoc = {
      ...eventData,
      startDate: Timestamp.fromDate(eventData.startDate),
      endDate: Timestamp.fromDate(eventData.endDate),
      registrations: 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, "events"), docData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating event:", error);
    throw new Error("Failed to create event");
  }
};

// Update an existing event
export const updateEvent = async (
  id: string,
  eventData: UpdateEventData
): Promise<void> => {
  try {
    const eventRef = doc(db, "events", id);

    // Destructure to separate date fields from other fields
    const { startDate, endDate, ...otherData } = eventData;

    const updateData: Partial<EventDoc> = {
      ...otherData,
      updatedAt: Timestamp.now(),
    };

    // Convert dates to Timestamps if provided
    if (startDate) {
      updateData.startDate = Timestamp.fromDate(startDate);
    }
    if (endDate) {
      updateData.endDate = Timestamp.fromDate(endDate);
    }

    await updateDoc(eventRef, updateData);
  } catch (error) {
    console.error("Error updating event:", error);
    throw new Error("Failed to update event");
  }
};

// Delete an event
export const deleteEvent = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "events", id));
  } catch (error) {
    console.error("Error deleting event:", error);
    throw new Error("Failed to delete event");
  }
};

// Get events by status
export const getEventsByStatus = async (
  status: Event["status"]
): Promise<Event[]> => {
  try {
    const eventsRef = collection(db, "events");
    const q = query(
      eventsRef,
      where("status", "==", status),
      orderBy("startDate", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) =>
      convertDocToEvent(doc.id, doc.data() as EventDoc)
    );
  } catch (error) {
    console.error("Error fetching events by status:", error);
    throw new Error("Failed to fetch events by status");
  }
};

// Get upcoming events
export const getUpcomingEvents = async (): Promise<Event[]> => {
  try {
    const eventsRef = collection(db, "events");
    const now = Timestamp.now();
    const q = query(
      eventsRef,
      where("startDate", ">", now),
      orderBy("startDate", "asc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) =>
      convertDocToEvent(doc.id, doc.data() as EventDoc)
    );
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    throw new Error("Failed to fetch upcoming events");
  }
};

// Get events count by status
export const getEventsStats = async () => {
  try {
    const events = await getEvents();
    const stats = {
      total: events.length,
      upcoming: events.filter((e) => e.status === "upcoming").length,
      ongoing: events.filter((e) => e.status === "ongoing").length,
      completed: events.filter((e) => e.status === "completed").length,
      cancelled: events.filter((e) => e.status === "cancelled").length,
      totalRegistrations: events.reduce((sum, e) => sum + e.registrations, 0),
      totalCapacity: events.reduce((sum, e) => sum + e.capacity, 0),
    };

    return stats;
  } catch (error) {
    console.error("Error fetching events stats:", error);
    throw new Error("Failed to fetch events statistics");
  }
};

// Real-time subscription to events collection
import type { Unsubscribe } from "firebase/firestore";

export const subscribeToEvents = (
  callback: (events: Event[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe => {
  try {
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, orderBy("startDate", "desc"));
    return onSnapshot(
      q,
      (querySnapshot) => {
        const results = querySnapshot.docs.map((doc) =>
          convertDocToEvent(doc.id, doc.data() as EventDoc)
        );
        callback(results);
      },
      (err) => {
        console.error("Realtime events subscription error", err);
        if (onError) onError(err);
      }
    );
  } catch (error) {
    console.error("Error subscribing to events:", error);
    if (onError) onError(error);
    // return noop
    return () => {};
  }
};

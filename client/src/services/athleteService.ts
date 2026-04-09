import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  writeBatch,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import {
  uploadAthleteMedia as uploadAthleteMediaToCloudinary,
  deleteAthleteMediaFromCloudinary,
} from "@/services/cloudinaryService";
import {
  Athlete,
  AthleteFilters,
  AthleteMedia,
  BulkAction,
} from "@/types/athlete";

const COLLECTION_NAME = "athletes";

export class AthleteService {
  // Create a new athlete
  static async createAthlete(
    athleteData: Omit<Athlete, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    try {
      const now = new Date().toISOString();

      // Filter out undefined values to avoid Firebase errors
      const filteredAthleteData: Record<string, unknown> = {};
      Object.entries(athleteData).forEach(([key, value]) => {
        if (value !== undefined) {
          filteredAthleteData[key] = value;
        }
      });

      const athlete: Record<string, unknown> = {
        ...filteredAthleteData,
        createdAt: now,
        updatedAt: now,
        status: filteredAthleteData.status || "active",
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), athlete);
      return docRef.id;
    } catch (error) {
      console.error("Error creating athlete:", error);
      throw new Error("Failed to create athlete");
    }
  }

  // Get athlete by ID
  static async getAthleteById(id: string): Promise<Athlete | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Athlete;
      }
      return null;
    } catch (error) {
      console.error("Error getting athlete:", error);
      throw new Error("Failed to get athlete");
    }
  }

  // Update athlete
  static async updateAthlete(
    id: string,
    updates: Partial<Athlete>,
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);

      // Filter out undefined values to avoid Firebase errors
      const filteredUpdates: Record<string, unknown> = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          filteredUpdates[key] = value;
        }
      });

      await updateDoc(docRef, {
        ...filteredUpdates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating athlete:", error);
      throw new Error("Failed to update athlete");
    }
  }

  // Delete athlete
  static async deleteAthlete(id: string): Promise<void> {
    try {
      // Delete associated media files first
      await this.deleteAthleteMedia(id);

      // Delete the athlete document
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting athlete:", error);
      throw new Error("Failed to delete athlete");
    }
  }

  // Get athletes with filters and pagination
  static async getAthletes(
    filters: AthleteFilters,
    pagination: { page: number; pageSize: number },
    lastDoc?: QueryDocumentSnapshot<DocumentData>,
  ): Promise<{
    athletes: Athlete[];
    lastDoc?: QueryDocumentSnapshot<DocumentData>;
    hasMore: boolean;
  }> {
    try {
      let q = query(collection(db, COLLECTION_NAME));

      // Apply filters
      if (filters.sport && filters.sport !== "all") {
        q = query(q, where("sport", "==", filters.sport));
      }

      if (filters.level && filters.level !== "all") {
        q = query(q, where("level", "==", filters.level));
      }

      if (filters.county && filters.county !== "all") {
        q = query(q, where("county", "==", filters.county));
      }

      if (filters.scoutingStatus && filters.scoutingStatus !== "all") {
        q = query(q, where("scoutingStatus", "==", filters.scoutingStatus));
      }

      if (filters.position && filters.position !== "all") {
        q = query(q, where("position", "==", filters.position));
      }

      // Add ordering and pagination
      q = query(q, orderBy("updatedAt", "desc"));

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      q = query(q, limit(pagination.pageSize + 1)); // Get one extra to check if there are more
      let querySnapshot;
      let usedFallback = false;
      try {
        querySnapshot = await getDocs(q);
      } catch (err: unknown) {
        // Firestore may require a composite index for certain queries.
        // Fall back to client-side filtering by fetching all docs if that happens.
        const errorMessage = (err as { message?: string })?.message;
        if (
          err &&
          errorMessage &&
          typeof errorMessage === "string" &&
          errorMessage.includes("requires an index")
        ) {
          console.warn(
            "Firestore index required for query; falling back to client-side filtering.",
          );
          querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
          usedFallback = true;
        } else {
          throw err;
        }
      }
      const athletes: Athlete[] = [];
      const docs = querySnapshot.docs;

      // If we fetched entire collection (usedFallback), apply the original filters client-side before pagination
      let processedDocs = docs;
      if (usedFallback) {
        processedDocs = docs.filter((d) => {
          const data = d.data() as Athlete;
          if (
            filters.sport &&
            filters.sport !== "all" &&
            data.sport !== filters.sport
          )
            return false;
          if (
            filters.level &&
            filters.level !== "all" &&
            data.level !== filters.level
          )
            return false;
          if (
            filters.county &&
            filters.county !== "all" &&
            data.county !== filters.county
          )
            return false;
          if (
            filters.scoutingStatus &&
            filters.scoutingStatus !== "all" &&
            data.scoutingStatus !== filters.scoutingStatus
          )
            return false;
          if (
            filters.position &&
            filters.position !== "all" &&
            data.position !== filters.position
          )
            return false;
          return true;
        });
      }

      // Process results
      const hasMore = processedDocs.length > pagination.pageSize;
      const docsToProcess = hasMore
        ? processedDocs.slice(0, -1)
        : processedDocs;

      docsToProcess.forEach((doc) => {
        const data = doc.data();
        athletes.push({ id: doc.id, ...data } as Athlete);
      });

      // Filter by search term (client-side for now, can be optimized with Algolia later)
      let filteredAthletes = athletes;
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredAthletes = athletes.filter(
          (athlete) =>
            athlete.name.toLowerCase().includes(searchTerm) ||
            athlete.position?.toLowerCase().includes(searchTerm) ||
            athlete.location?.toLowerCase().includes(searchTerm) ||
            athlete.bio?.toLowerCase().includes(searchTerm),
        );
      }

      // Note: when usedFallback is true we already applied the original filters client-side above,
      // so there's no need to inspect internal query properties.

      return {
        athletes: filteredAthletes,
        lastDoc: hasMore ? docs[docs.length - 2] : undefined,
        hasMore: hasMore && filteredAthletes.length === pagination.pageSize,
      };
    } catch (error) {
      console.error("Error getting athletes:", error);
      throw new Error("Failed to get athletes");
    }
  }

  // Get athletes count for pagination
  static async getAthletesCount(filters: AthleteFilters): Promise<number> {
    try {
      let q = query(collection(db, COLLECTION_NAME));

      // Apply same filters as getAthletes
      if (filters.sport && filters.sport !== "all") {
        q = query(q, where("sport", "==", filters.sport));
      }

      if (filters.level && filters.level !== "all") {
        q = query(q, where("level", "==", filters.level));
      }

      if (filters.county && filters.county !== "all") {
        q = query(q, where("county", "==", filters.county));
      }

      if (filters.scoutingStatus && filters.scoutingStatus !== "all") {
        q = query(q, where("scoutingStatus", "==", filters.scoutingStatus));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      // If index required, fetch all and filter client-side
      try {
        const errorMessage = (error as { message?: string })?.message;
        if (
          error &&
          errorMessage &&
          typeof errorMessage === "string" &&
          errorMessage.includes("requires an index")
        ) {
          console.warn(
            "Firestore index required for count query; falling back to client-side count.",
          );
          const allDocs = await getDocs(collection(db, COLLECTION_NAME));
          let athletes: Athlete[] = [];
          allDocs.forEach((doc) =>
            athletes.push({ id: doc.id, ...doc.data() } as Athlete),
          );

          // Apply same filters
          if (filters.sport && filters.sport !== "all")
            athletes = athletes.filter((a) => a.sport === filters.sport);
          if (filters.level && filters.level !== "all")
            athletes = athletes.filter((a) => a.level === filters.level);
          if (filters.county && filters.county !== "all")
            athletes = athletes.filter((a) => a.county === filters.county);
          if (filters.scoutingStatus && filters.scoutingStatus !== "all")
            athletes = athletes.filter(
              (a) => a.scoutingStatus === filters.scoutingStatus,
            );

          return athletes.length;
        }
      } catch (e) {
        console.error("Fallback counting error:", e);
      }

      console.error("Error getting athletes count:", error);
      return 0;
    }
  }

  // Upload athlete media (photos/videos) using Cloudinary
  static async uploadAthleteMedia(
    athleteId: string,
    file: File,
    type: "photo" | "video",
    caption?: string,
  ): Promise<AthleteMedia> {
    try {
      // Upload to Cloudinary
      const cloudinaryResult = await uploadAthleteMediaToCloudinary(
        file,
        athleteId,
        type,
        caption,
      );

      const media: AthleteMedia = {
        id: cloudinaryResult.publicId,
        url: cloudinaryResult.url,
        type,
        uploadedAt: new Date().toISOString(),
        size: file.size,
        mimeType: file.type,
      };

      // Only add caption if it has a value
      if (caption) {
        media.caption = caption;
      }

      // Update athlete document with new media
      const athlete = await this.getAthleteById(athleteId);
      if (athlete) {
        const updatedMedia = [...(athlete.media || []), media];
        await this.updateAthlete(athleteId, { media: updatedMedia });
      }

      return media;
    } catch (error) {
      console.error("Error uploading athlete media:", error);
      throw new Error("Failed to upload media");
    }
  }

  // Delete athlete media using Cloudinary
  static async deleteAthleteMedia(
    athleteId: string,
    mediaId?: string,
  ): Promise<void> {
    try {
      if (mediaId) {
        // Delete specific media file
        const athlete = await this.getAthleteById(athleteId);
        if (athlete?.media) {
          const mediaItem = athlete.media.find((m) => m.id === mediaId);
          if (mediaItem) {
            // Delete from Cloudinary using the public ID (stored as media.id)
            await deleteAthleteMediaFromCloudinary(
              athleteId,
              mediaItem.id,
              mediaItem.type,
            );

            // Update athlete document
            const updatedMedia = athlete.media.filter((m) => m.id !== mediaId);
            await this.updateAthlete(athleteId, { media: updatedMedia });
          }
        }
      } else {
        // Delete all media for athlete
        const athlete = await this.getAthleteById(athleteId);
        if (athlete?.media) {
          // Delete each media item from Cloudinary
          const deletePromises = athlete.media.map((mediaItem) =>
            deleteAthleteMediaFromCloudinary(
              athleteId,
              mediaItem.id,
              mediaItem.type,
            ),
          );
          await Promise.all(deletePromises);

          // Clear media from athlete document
          await this.updateAthlete(athleteId, { media: [] });
        }
      }
    } catch (error) {
      console.error("Error deleting athlete media:", error);
      throw new Error("Failed to delete media");
    }
  }

  // Bulk operations
  static async bulkUpdateAthletes(action: BulkAction): Promise<void> {
    try {
      const batch = writeBatch(db);

      switch (action.type) {
        case "updateStatus":
          action.athleteIds.forEach((id) => {
            const docRef = doc(db, COLLECTION_NAME, id);
            if (action.data) {
              batch.update(docRef, {
                status: action.data.status,
                updatedAt: new Date().toISOString(),
              });
            }
          });
          break;

        case "updateLevel":
          action.athleteIds.forEach((id) => {
            const docRef = doc(db, COLLECTION_NAME, id);
            if (action.data) {
              batch.update(docRef, {
                level: action.data.level,
                updatedAt: new Date().toISOString(),
              });
            }
          });
          break;

        case "assignProgram":
          action.athleteIds.forEach((id) => {
            const docRef = doc(db, COLLECTION_NAME, id);
            if (action.data) {
              batch.update(docRef, {
                trainingProgram: action.data.program,
                updatedAt: new Date().toISOString(),
              });
            }
          });
          break;

        case "delete":
          action.athleteIds.forEach((id) => {
            const docRef = doc(db, COLLECTION_NAME, id);
            batch.delete(docRef);
          });
          break;
      }

      await batch.commit();
    } catch (error) {
      console.error("Error performing bulk operation:", error);
      throw new Error("Failed to perform bulk operation");
    }
  }

  // Export athletes to CSV
  static async exportAthletesToCSV(filters: AthleteFilters): Promise<string> {
    try {
      const { athletes } = await this.getAthletes(filters, {
        page: 1,
        pageSize: 10000,
      });

      const headers = [
        "Name",
        "Age",
        "Position",
        "Sport",
        "Level",
        "County",
        "Location",
        "Scouting Status",
        "Email",
        "Phone",
        "Bio",
        "Training Program",
        "Goals",
        "Assists",
        "Matches",
        "Created At",
      ];

      const csvContent = [
        headers.join(","),
        ...athletes.map((athlete) =>
          [
            `"${athlete.name}"`,
            athlete.age || "",
            `"${athlete.position || ""}"`,
            athlete.sport,
            athlete.level,
            `"${athlete.county || ""}"`,
            `"${athlete.location || ""}"`,
            athlete.scoutingStatus,
            `"${athlete.contact?.email || ""}"`,
            `"${athlete.contact?.phone || ""}"`,
            `"${athlete.bio?.replace(/"/g, '""') || ""}"`,
            `"${athlete.trainingProgram || ""}"`,
            athlete.stats?.goals || "",
            athlete.stats?.assists || "",
            athlete.stats?.matches || "",
            athlete.createdAt,
          ].join(","),
        ),
      ].join("\n");

      return csvContent;
    } catch (error) {
      console.error("Error exporting athletes:", error);
      throw new Error("Failed to export athletes");
    }
  }

  // Import athletes from CSV
  static async importAthletesFromCSV(
    csvContent: string,
    userId: string,
  ): Promise<{ success: number; errors: string[] }> {
    try {
      const lines = csvContent.split("\n");
      const errors: string[] = [];
      let success = 0;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        try {
          const values = lines[i].split(",").map((v) => v.replace(/"/g, ""));

          // Build athlete data without undefined values for Firebase compatibility
          const athleteData: Partial<Athlete> = {
            name: values[0] || "",
            sport: values[3] || "football",
            level: (values[4] as Athlete["level"]) || "grassroots",
            scoutingStatus:
              (values[7] as Athlete["scoutingStatus"]) || "active",
            createdBy: userId,
            status: "active",
          };

          // Only add fields that have values
          if (values[1] && !isNaN(parseInt(values[1]))) {
            athleteData.age = parseInt(values[1]);
          }
          if (values[2]) {
            athleteData.position = values[2];
          }
          if (values[5]) {
            athleteData.county = values[5];
          }
          if (values[6]) {
            athleteData.location = values[6];
          }
          if (values[10]) {
            athleteData.bio = values[10];
          }
          if (values[11]) {
            athleteData.trainingProgram = values[11];
          }

          // Handle contact info
          const contact: Record<string, string> = {};
          if (values[8]) contact.email = values[8];
          if (values[9]) contact.phone = values[9];
          if (Object.keys(contact).length > 0) {
            athleteData.contact = contact;
          }

          // Handle stats
          const stats: Record<string, number> = {};
          if (values[12] && !isNaN(parseInt(values[12])))
            stats.goals = parseInt(values[12]);
          if (values[13] && !isNaN(parseInt(values[13])))
            stats.assists = parseInt(values[13]);
          if (values[14] && !isNaN(parseInt(values[14])))
            stats.matches = parseInt(values[14]);
          if (Object.keys(stats).length > 0) {
            athleteData.stats = stats;
          }

          if (!athleteData.name) {
            errors.push(`Row ${i + 1}: Name is required`);
            continue;
          }

          await this.createAthlete(
            athleteData as Omit<Athlete, "id" | "createdAt" | "updatedAt">,
          );
          success++;
        } catch (error) {
          errors.push(
            `Row ${i + 1}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          );
        }
      }

      return { success, errors };
    } catch (error) {
      console.error("Error importing athletes:", error);
      throw new Error("Failed to import athletes");
    }
  }

  // Real-time subscription to athletes
  static subscribeToAthletes(
    filters: AthleteFilters,
    callback: (athletes: Athlete[]) => void,
  ): Unsubscribe {
    try {
      let q = query(collection(db, COLLECTION_NAME));

      // Apply filters
      if (filters.sport && filters.sport !== "all") {
        q = query(q, where("sport", "==", filters.sport));
      }

      if (filters.level && filters.level !== "all") {
        q = query(q, where("level", "==", filters.level));
      }

      q = query(q, orderBy("updatedAt", "desc"));

      return onSnapshot(q, (querySnapshot) => {
        const athletes: Athlete[] = [];
        querySnapshot.forEach((doc) => {
          athletes.push({ id: doc.id, ...doc.data() } as Athlete);
        });

        // Apply search filter client-side
        let filteredAthletes = athletes;
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredAthletes = athletes.filter(
            (athlete) =>
              athlete.name.toLowerCase().includes(searchTerm) ||
              athlete.position?.toLowerCase().includes(searchTerm) ||
              athlete.location?.toLowerCase().includes(searchTerm),
          );
        }

        callback(filteredAthletes);
      });
    } catch (error) {
      // If index is required, fall back to subscribing to entire collection and filtering client-side
      const errorMessage = (error as { message?: string })?.message;
      if (
        errorMessage &&
        typeof errorMessage === "string" &&
        errorMessage.includes("requires an index")
      ) {
        console.warn(
          "Firestore index required for subscription query; falling back to client-side subscribe.",
        );
        return onSnapshot(collection(db, COLLECTION_NAME), (querySnapshot) => {
          const athletes: Athlete[] = [];
          querySnapshot.forEach((doc) => {
            athletes.push({ id: doc.id, ...doc.data() } as Athlete);
          });

          let filteredAthletes = athletes;
          if (filters.sport && filters.sport !== "all")
            filteredAthletes = filteredAthletes.filter(
              (a) => a.sport === filters.sport,
            );
          if (filters.level && filters.level !== "all")
            filteredAthletes = filteredAthletes.filter(
              (a) => a.level === filters.level,
            );

          if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredAthletes = filteredAthletes.filter(
              (athlete) =>
                athlete.name.toLowerCase().includes(searchTerm) ||
                athlete.position?.toLowerCase().includes(searchTerm) ||
                athlete.location?.toLowerCase().includes(searchTerm),
            );
          }

          callback(filteredAthletes);
        });
      }

      console.error("Error subscribing to athletes:", error);
      throw new Error("Failed to subscribe to athletes");
    }
  }

  // Get athlete statistics
  static async getAthleteStatistics(): Promise<{
    total: number;
    byLevel: Record<string, number>;
    bySport: Record<string, number>;
    byCounty: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const athletes: Athlete[] = [];

      querySnapshot.forEach((doc) => {
        athletes.push({ id: doc.id, ...doc.data() } as Athlete);
      });

      const stats = {
        total: athletes.length,
        byLevel: {} as Record<string, number>,
        bySport: {} as Record<string, number>,
        byCounty: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
      };

      athletes.forEach((athlete) => {
        // By level
        stats.byLevel[athlete.level] = (stats.byLevel[athlete.level] || 0) + 1;

        // By sport
        stats.bySport[athlete.sport] = (stats.bySport[athlete.sport] || 0) + 1;

        // By county
        if (athlete.county) {
          stats.byCounty[athlete.county] =
            (stats.byCounty[athlete.county] || 0) + 1;
        }

        // By status
        stats.byStatus[athlete.scoutingStatus] =
          (stats.byStatus[athlete.scoutingStatus] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error("Error getting athlete statistics:", error);
      throw new Error("Failed to get athlete statistics");
    }
  }
}

export default AthleteService;

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";

export interface Program {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "draft" | "upcoming";
  startDate: string;
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgramDoc {
  name: string;
  description: string;
  status: "active" | "inactive" | "draft" | "upcoming";
  startDate: string;
  endDate: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateProgramData {
  name: string;
  description: string;
  status: "active" | "inactive" | "draft" | "upcoming";
  startDate: string;
  endDate: string;
}

export interface UpdateProgramData extends CreateProgramData {
  id: string;
}

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

// Convert Firestore document to Program interface
const convertDocToProgram = (id: string, doc: ProgramDoc): Program => ({
  id,
  name: doc.name,
  description: doc.description,
  status: doc.status,
  startDate: doc.startDate,
  endDate: doc.endDate,
  createdAt: toDate(doc.createdAt),
  updatedAt: toDate(doc.updatedAt),
});

// Get all programs
export const getPrograms = async (): Promise<Program[]> => {
  try {
    const programsRef = collection(db, "programs");
    const q = query(programsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) =>
      convertDocToProgram(doc.id, doc.data() as ProgramDoc)
    );
  } catch (error) {
    console.error("Error fetching programs:", error);
    throw new Error("Failed to fetch programs");
  }
};

// Create a new program
export const createProgram = async (
  programData: CreateProgramData
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docData: ProgramDoc = {
      ...programData,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, "programs"), docData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating program:", error);
    throw new Error("Failed to create program");
  }
};

// Update an existing program
export const updateProgram = async (
  programData: UpdateProgramData
): Promise<void> => {
  try {
    const { id, ...updateData } = programData;
    const programRef = doc(db, "programs", id);

    const docData: Partial<ProgramDoc> = {
      ...updateData,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(programRef, docData);
  } catch (error) {
    console.error("Error updating program:", error);
    throw new Error("Failed to update program");
  }
};

// Delete a program
export const deleteProgram = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "programs", id));
  } catch (error) {
    console.error("Error deleting program:", error);
    throw new Error("Failed to delete program");
  }
};

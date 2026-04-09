import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mock program names to remove
const mockProgramNames = [
  "Mobile App Development",
  "Web Development Bootcamp",
  "Data Science Fundamentals",
];

// Mock event names to remove
const mockEventNames = [
  "Benzard FC Youth Tournament",
  "Football Tournament 2024",
  "Youth Training Camp",
];

async function cleanMockData() {
  try {
    console.log("Starting to clean mock data from Firebase collections...");

    // Clean programs collection
    console.log("\nCleaning programs collection...");
    const programsRef = collection(db, "programs");
    const programsSnapshot = await getDocs(programsRef);

    let deletedPrograms = 0;
    for (const docSnapshot of programsSnapshot.docs) {
      const data = docSnapshot.data();
      const programTitle = data.title || data.name || "";
      if (mockProgramNames.includes(programTitle)) {
        await deleteDoc(doc(db, "programs", docSnapshot.id));
        console.log(`✓ Deleted mock program: "${programTitle}"`);
        deletedPrograms++;
      }
    }

    // Clean events collection
    console.log("\nCleaning events collection...");
    const eventsRef = collection(db, "events");
    const eventsSnapshot = await getDocs(eventsRef);

    let deletedEvents = 0;
    for (const docSnapshot of eventsSnapshot.docs) {
      const data = docSnapshot.data();
      const eventTitle = data.title || data.name || "";
      if (mockEventNames.includes(eventTitle)) {
        await deleteDoc(doc(db, "events", docSnapshot.id));
        console.log(`✓ Deleted mock event: "${eventTitle}"`);
        deletedEvents++;
      }
    }

    console.log("\n=== Cleanup Summary ===");
    console.log(`✓ Deleted ${deletedPrograms} mock programs`);
    console.log(`✓ Deleted ${deletedEvents} mock events`);
    console.log("\n✅ Mock data cleanup completed!");
    console.log("The dashboard will now show only real live data.");
  } catch (error) {
    console.error("❌ Error cleaning mock data:", error);
    process.exit(1);
  }

  process.exit(0);
}

cleanMockData();

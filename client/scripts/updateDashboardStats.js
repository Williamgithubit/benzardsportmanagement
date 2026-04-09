import { initializeApp, cert, getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (prioritize .env.local, then .env)
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("Starting dashboard stats update...");

const normalizePrivateKey = (value) => {
  if (!value) {
    return undefined;
  }

  return value
    .trim()
    .replace(/\\n/g, "\n")
    .replace(/^"(.*)"$/s, "$1")
    .replace(/"\s*,?\s*$/, "")
    .trim();
};

// Build service account object from env vars
const serviceAccount = {
  type: "service_account",
  project_id:
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  private_key: normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
};

if (
  !serviceAccount.project_id ||
  !serviceAccount.client_email ||
  !serviceAccount.private_key
) {
  console.error("Missing Firebase Admin SDK environment variables.");
  console.error(
    "Please set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY (multiline key with \n escaped)."
  );
  process.exit(1);
}

let adminApp;
try {
  if (!getApps().length) {
    adminApp = initializeApp({ credential: cert(serviceAccount) });
  } else {
    adminApp = getApp();
  }
} catch (err) {
  console.error("Failed to initialize Firebase Admin:", err);
  process.exit(1);
}

const db = getFirestore(adminApp);

async function computeAndWriteStats() {
  try {
    // Total users
    const usersSnap = await db.collection("users").get();
    const totalUsers = usersSnap.size;

    // Active programs
    const programsSnap = await db
      .collection("programs")
      .where("status", "==", "active")
      .get();
    const activePrograms = programsSnap.size;

    // Upcoming events: date >= now and not cancelled
    const now = new Date();
    const eventsSnap = await db.collection("events").get();
    let upcomingEvents = 0;
    eventsSnap.forEach((doc) => {
      const data = doc.data();
      const dateField = data.date;
      let eventDate = null;
      if (dateField && typeof dateField.toDate === "function") {
        eventDate = dateField.toDate();
      } else if (dateField) {
        eventDate = new Date(dateField);
      }
      const status = data.status;
      if (eventDate && eventDate >= now && status !== "cancelled")
        upcomingEvents++;
    });

    // Tasks completed percentage
    const tasksSnap = await db.collection("tasks").get();
    let completed = 0;
    tasksSnap.forEach((doc) => {
      const d = doc.data();
      if (d.status === "completed") completed++;
    });
    const tasksCompleted =
      tasksSnap.size > 0 ? Math.round((completed / tasksSnap.size) * 100) : 0;

    // Certificates count
    const certsSnap = await db.collection("certificates").get();
    const totalCertificates = certsSnap.size;

    const stats = {
      totalUsers,
      activePrograms,
      upcomingEvents,
      tasksCompleted,
      totalCertificates,
      updatedAt: new Date().toISOString(),
    };

    // Write to dashboard/stats (merge)
    const statsRef = db.collection("dashboard").doc("stats");
    await statsRef.set(stats, { merge: true });

    console.log("Dashboard stats updated successfully:", stats);
    process.exit(0);
  } catch (error) {
    console.error("Error computing or writing stats:", error);
    process.exit(1);
  }
}

computeAndWriteStats();

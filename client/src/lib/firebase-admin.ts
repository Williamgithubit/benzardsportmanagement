import {
  cert,
  getApps,
  initializeApp as initAdminApp,
  getApp as getAdminApp,
} from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

const normalizePrivateKey = (value?: string | null) => {
  if (!value) {
    return undefined;
  }

  return value
    .trim()
    .replace(/\\n/g, "\n")
    .replace(/^"|"$/g, "")
    .replace(/"\s*,?\s*$/, "")
    .trim();
};

// Initialize Firebase Admin with proper error handling
let adminApp: ReturnType<typeof initAdminApp> | null = null;
let adminAuth: ReturnType<typeof getAdminAuth> | null = null;
let adminDb: ReturnType<typeof getAdminFirestore> | null = null;

try {
  // Try multiple approaches to initialize Firebase Admin SDK

  // Approach 1: Check for individual credential environment variables
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(
    process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  );

  // Approach 2: Check for complete service account JSON
  const serviceAccountKey =
    process.env.FIREBASE_ADMIN_SDK_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_ADMIN_SDK_KEY;

  // Determine which approach to use
  let firebaseAdminConfig: Record<string, unknown> | null = null;

  // Log credential availability (safely)
  console.log("Firebase Admin credential check:", {
    hasProjectId: !!projectId,
    hasClientEmail: !!clientEmail,
    hasPrivateKey: !!privateKey,
    hasServiceAccountKey: !!serviceAccountKey,
  });

  if (projectId && clientEmail && privateKey) {
    // Use individual credential variables
    console.log(
      "Initializing Firebase Admin SDK with individual credential variables",
    );
    try {
      firebaseAdminConfig = {
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      };
      console.log("Successfully created cert with individual credentials");
    } catch (certError) {
      console.error(
        "Failed to create cert with individual credentials:",
        certError,
      );
      throw certError;
    }
  } else if (serviceAccountKey) {
    // Use complete service account JSON
    console.log("Initializing Firebase Admin SDK with service account JSON");
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);

      // Validate required fields
      if (
        !serviceAccount.private_key ||
        !serviceAccount.client_email ||
        !serviceAccount.project_id
      ) {
        throw new Error("Invalid service account key: missing required fields");
      }

      firebaseAdminConfig = {
        credential: cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: normalizePrivateKey(serviceAccount.private_key),
        }),
      };
    } catch (parseError) {
      console.error("Failed to parse service account JSON:", parseError);
      throw new Error("Invalid service account JSON format");
    }
  } else {
    console.warn(
      "Firebase Admin SDK credentials not found. Admin features will be disabled.",
    );
  }

  // Only initialize if we have valid config
  if (firebaseAdminConfig) {
    // Initialize Firebase Admin
    adminApp = !getApps().length
      ? initAdminApp(firebaseAdminConfig)
      : getAdminApp();
    adminAuth = getAdminAuth(adminApp);
    try {
      adminDb = getAdminFirestore(adminApp);
      // Enable ignoring undefined values
      adminDb.settings({ ignoreUndefinedProperties: true });
    } catch (dbErr) {
      console.warn("Failed to initialize admin Firestore:", dbErr);
      adminDb = null;
    }
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin SDK:", error);
  // Don't throw error during build - just log it
  adminApp = null;
  adminAuth = null;
}

export { adminAuth, adminApp, adminDb };

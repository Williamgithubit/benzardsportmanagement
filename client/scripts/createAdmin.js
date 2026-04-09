// Script to create an admin user in Firebase Authentication and Firestore
import { initializeApp, cert, getApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Also load from .env as fallback
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const normalizePrivateKey = (value) => {
  if (!value) {
    return undefined;
  }

  return value
    .trim()
    .replace(/\\n/g, '\n')
    .replace(/^"(.*)"$/s, '$1')
    .replace(/"\s*,?\s*$/, '')
    .trim();
};

// Initialize Firebase Admin
console.log('Initializing Firebase Admin...');
let adminAuth, db;

try {
  // Create service account object from environment variables
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    private_key: normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY)
  };
  
  // Validate required fields
  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('Missing required Firebase Admin SDK environment variables. Please check FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in your .env.local file.');
  }
  
  // Initialize Firebase Admin if not already initialized
  let adminApp;
  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert(serviceAccount)
    });
  } else {
    adminApp = getApp();
  }

  adminAuth = getAuth(adminApp);
  db = getFirestore(adminApp);
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
}

async function createAdminUser() {
  console.log('Starting admin user creation process...');
  const adminEmail =
    process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const adminPassword =
    process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('Error: Admin email and password must be provided in .env file');
    console.log('Please make sure you have the following in your .env file:');
    console.log('ADMIN_EMAIL=your-email@example.com');
    console.log('ADMIN_PASSWORD=your-strong-password');
    process.exit(1);
  }

  console.log(`Creating admin user with email: ${adminEmail}`);

  try {
    // Check if user already exists
    try {
      const existingUser = await adminAuth.getUserByEmail(adminEmail);
      console.log('User already exists. Updating user role and claims...');
      
      // Update custom claims
      await adminAuth.setCustomUserClaims(existingUser.uid, { 
        admin: true,
        role: 'admin'
      });
      
      // Update user in Firestore
      const userRef = db.collection('users').doc(existingUser.uid);
      await userRef.set({
        uid: existingUser.uid,
        email: adminEmail,
        role: 'admin',
        displayName: 'Admin User',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      console.log('Successfully updated existing user with admin privileges');
      console.log(`User ID: ${existingUser.uid}`);
      console.log(`Email: ${adminEmail}`);
      console.log('You can now log in to the admin dashboard');
      process.exit(0);
      
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error; // Re-throw if it's not a "user not found" error
      }
      
      // If we get here, user doesn't exist, so create a new one
      console.log('Creating new admin user...');
      const userRecord = await adminAuth.createUser({
        email: adminEmail,
        password: adminPassword,
        emailVerified: true,
        displayName: 'Admin User'
      });

      console.log('Successfully created admin user');
      console.log(`User ID: ${userRecord.uid}`);

      // Set custom claims for admin access
      await adminAuth.setCustomUserClaims(userRecord.uid, { 
        admin: true,
        role: 'admin'
      });
      console.log('Set custom claims for admin access');

      // Add user to Firestore with admin role
      const userRef = db.collection('users').doc(userRecord.uid);
      await userRef.set({
        uid: userRecord.uid,
        email: adminEmail,
        role: 'admin',
        displayName: 'Admin User',
        createdAt: new Date().toISOString(),
        lastLogin: null,
        status: 'active'
      }, { merge: true });

      console.log('Added user to Firestore with admin role');
      console.log('\nAdmin user setup complete!');
      console.log(`Email: ${adminEmail}`);
      console.log('You can now log in to the admin dashboard');
      
      process.exit(0);
    }
  } catch (error) {
    console.error('Error in admin user creation process:');
    console.error(error);
    
    if (error.code === 'auth/email-already-exists') {
      console.error('\nA user with this email already exists in Firebase Authentication.');
      console.error('Please use a different email or delete the existing user from Firebase Console.');
    } else if (error.code === 'auth/invalid-email') {
      console.error('\nThe provided email is invalid.');
    } else if (error.code === 'auth/weak-password') {
      console.error('\nThe provided password is too weak. Please use a stronger password.');
    } else if (error.code === 'app/no-app') {
      console.error('\nFirebase Admin SDK not properly initialized.');
      console.error('Make sure you have a valid service account key in your .env file.');
    }
    
    process.exit(1);
  }
}

createAdminUser();

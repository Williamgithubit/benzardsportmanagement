import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getFirestore, DocumentData, QueryDocumentSnapshot, Firestore } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';
import { UserRecord } from 'firebase-admin/auth';

// Configure runtime to use Node.js instead of Edge (required for Firebase Admin SDK)
export const runtime = 'nodejs';

// Get Firestore instance if Firebase Admin is initialized
let db: Firestore | null = null;
try {
  if (getApps().length > 0) {
    db = getFirestore();
  }
} catch (error) {
  console.error('Failed to get Firestore instance:', error);
  db = null;
}

export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin SDK is available
    if (!adminAuth || !db) {
      return NextResponse.json({
        error: 'Firebase Admin SDK not initialized',
        message: 'Admin SDK is not available. Check environment variables.',
        success: false
      }, { status: 500 });
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and check admin role
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      if (!decodedToken.admin && decodedToken.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get all users from Firebase Auth
    const listUsersResult = await adminAuth.listUsers(1000); // Get up to 1000 users
    
    // Get additional user data from Firestore
    const usersCollection = db.collection('users');
    const firestoreUsers = await usersCollection.get();
    
    // Create a map of Firestore user data
    const firestoreUserMap = new Map();
    firestoreUsers.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      firestoreUserMap.set(doc.id, doc.data());
    });

    // Define interface for formatted user data
    interface FormattedUser {
      id: string;
      email: string;
      name: string;
      role: string;
      status: string;
      lastLogin: string | null;
      createdAt: string;
      emailVerified: boolean;
      photoURL: string | null;
    }
    
    // Format users for the frontend
    const formattedUsers: FormattedUser[] = listUsersResult.users.map((user: UserRecord): FormattedUser => {
      const firestoreData: Record<string, unknown> = firestoreUserMap.get(user.uid) || {};
      
      return {
        id: user.uid,
        email: user.email || '',
        name: String(user.displayName || firestoreData.displayName || user.email?.split('@')[0] || 'User'),
        role: String(user.customClaims?.role || firestoreData.role || 'user'),
        status: String(firestoreData.status || (user.disabled ? 'inactive' : 'active')),
        lastLogin: firestoreData.lastLogin ? String(firestoreData.lastLogin) : null,
        createdAt: user.metadata.creationTime,
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || (firestoreData.photoURL ? String(firestoreData.photoURL) : null),
      };
    });

    // Sort by creation date (newest first)
    formattedUsers.sort((a: FormattedUser, b: FormattedUser) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(formattedUsers);
  } catch (error: unknown) {
    console.error('Error fetching users:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage === 'Unauthorized' ? 401 : errorMessage === 'Forbidden' ? 403 : 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase Admin SDK is available
    if (!adminAuth || !db) {
      return NextResponse.json({
        error: 'Firebase Admin SDK not initialized',
        message: 'Admin SDK is not available. Check environment variables.',
        success: false
      }, { status: 500 });
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and check admin role
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      if (!decodedToken.admin && decodedToken.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse request body
    const userData = await request.json();
    const { email, password, name, role, status } = userData;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true,
    });

    // Set custom claims for role
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role,
      admin: role === 'admin'
    });

    // Add user to Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName: name,
      role,
      status: status || 'active',
      createdAt: new Date().toISOString(),
      lastLogin: null,
    });

    return NextResponse.json({
      id: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName,
      role,
      status: status || 'active',
      message: 'User created successfully'
    });
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    let statusCode = 500;
    
    // Map specific Firebase error codes
    if (errorMessage.includes('email-already-exists')) {
      statusCode = 409;
    } else if (errorMessage.includes('invalid-email')) {
      statusCode = 400;
    } else if (errorMessage.includes('weak-password')) {
      statusCode = 400;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';

export const runtime = 'nodejs';

let db: Firestore | null = null;
try {
  if (getApps().length > 0) {
    db = getFirestore();
  }
} catch (error) {
  console.error('Failed to get Firestore instance:', error);
  db = null;
}

export async function POST(request: NextRequest) {
  try {
    if (!adminAuth || !db) {
      return NextResponse.json({
        error: 'Firebase Admin SDK not initialized',
        success: false
      }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      if (!decodedToken.admin && decodedToken.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userData = await request.json();
    const { email, password, name, role } = userData;

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

    return NextResponse.json({
      id: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName,
      role,
      message: 'Auth user created successfully'
    });
  } catch (error: unknown) {
    console.error('Error creating auth user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    let statusCode = 500;
    
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

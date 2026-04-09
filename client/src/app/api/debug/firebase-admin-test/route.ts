import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Check if adminAuth is initialized
    if (!adminAuth) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Firebase Admin SDK not initialized',
        initialized: false,
        environment: {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'set' : 'not set',
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 'set' : 'not set',
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'set' : 'not set',
          adminSdkKey: (process.env.FIREBASE_ADMIN_SDK_KEY || process.env.NEXT_PUBLIC_FIREBASE_ADMIN_SDK_KEY) ? 'set' : 'not set'
        }
      }, { status: 500 });
    }

    // Try to list users (limit to 1) to verify the SDK works
    try {
      const listUsersResult = await adminAuth.listUsers(1);
      return NextResponse.json({ 
        status: 'success', 
        message: 'Firebase Admin SDK initialized successfully',
        initialized: true,
        userCount: listUsersResult.users.length,
        environment: {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'set' : 'not set',
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 'set' : 'not set',
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'set' : 'not set',
          adminSdkKey: (process.env.FIREBASE_ADMIN_SDK_KEY || process.env.NEXT_PUBLIC_FIREBASE_ADMIN_SDK_KEY) ? 'set' : 'not set'
        }
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ 
        status: 'error', 
        message: 'Firebase Admin SDK initialized but failed to list users',
        error: msg,
        initialized: true,
        environment: {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'set' : 'not set',
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 'set' : 'not set',
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'set' : 'not set',
          adminSdkKey: (process.env.FIREBASE_ADMIN_SDK_KEY || process.env.NEXT_PUBLIC_FIREBASE_ADMIN_SDK_KEY) ? 'set' : 'not set'
        }
      }, { status: 500 });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      status: 'error', 
      message: msg,
      initialized: false,
      environment: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'set' : 'not set',
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 'set' : 'not set',
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'set' : 'not set',
        adminSdkKey: (process.env.FIREBASE_ADMIN_SDK_KEY || process.env.NEXT_PUBLIC_FIREBASE_ADMIN_SDK_KEY) ? 'set' : 'not set'
      }
    }, { status: 500 });
  }
}

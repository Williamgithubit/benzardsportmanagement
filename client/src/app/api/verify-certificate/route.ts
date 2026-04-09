import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { FirebaseCertificate } from '@/services/firebaseCertificateService';

export async function POST(request: NextRequest) {
  try {
    console.log('Certificate verification API called');
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { certificateNumber } = body;

    // Validate input
    if (!certificateNumber || typeof certificateNumber !== 'string') {
      return NextResponse.json(
        { error: 'Certificate number is required' },
        { status: 400 }
      );
    }

    // Clean the certificate number
    const cleanCertNumber = certificateNumber.trim();

    // Test Firebase connection first
    console.log('Testing Firebase connection...');
    if (!db) {
      console.error('Firebase database not initialized');
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get certificate from Firestore
    const docRef = doc(db, 'certificates', cleanCertNumber);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Certificate not found. Please check your certificate number and try again.'
      });
    }

    const certificateData = docSnap.data();
    // Validate certificate data structure
    if (!certificateData) {
      console.error('Certificate data is null or undefined');
      return NextResponse.json({
        success: false,
        error: 'Invalid certificate data format.'
      }, { status: 400 });
    }

    // Type assertion with validation
    const certData = certificateData as Partial<FirebaseCertificate>;
    console.log('Processed certificate data:', certData);

    // Check if certificate is valid
    if (certData.status !== 'Valid') {
      return NextResponse.json({
        success: false,
        error: certData.status ? `Certificate status: ${certData.status}` : 'Certificate is not valid.'
      });
    }

    // Format the date
    const formatDate = (timestamp: { toDate?: () => Date, seconds?: number } | string | number | null | undefined) => {
      if (!timestamp) return new Date().toISOString();
      try {
        if (typeof timestamp === 'object' && timestamp !== null) {
          if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toISOString();
          }
          if ('seconds' in timestamp && typeof timestamp.seconds === 'number') {
            return new Date(timestamp.seconds * 1000).toISOString();
          }
        }
        return new Date(timestamp as string | number).toISOString();
      } catch {
        return new Date().toISOString();
      }
    };

    if (!certData.certificateNumber || !certData.fullName || !certData.program || certData.yearOfCompletion === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Certificate data is incomplete.'
      }, { status: 500 });
    }

    const response = {
      success: true,
      certificate: {
        certificateNumber: certData.certificateNumber,
        studentName: certData.fullName,
        program: certData.program,
        graduationYear: certData.yearOfCompletion,
        status: (certData.status || '').toLowerCase(),
        issuedDate: formatDate(certData.createdAt),
        studentImageUrl: certData.studentImageUrl || null
      }
    };
    
    return NextResponse.json(response);

  } catch {
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

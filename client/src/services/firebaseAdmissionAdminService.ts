import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  deleteDoc,
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { db } from './firebase';
import { FirebaseAdmissionApplication } from './firebaseAdmissionService';
import { deleteAdmissionFileFromCloudinary } from './cloudinaryService';

/**
 * Test Firebase connection and collection access
 * @returns Promise<void>
 */
export async function testFirebaseConnection(): Promise<void> {
  try {
    console.log('Testing Firebase connection...');
    console.log('Database instance:', db);
    console.log('Database app:', db.app);
    console.log('Database app name:', db.app.name);
    console.log('Database app options:', db.app.options);
    
    // Test basic collection reference
    const applicationsRef = collection(db, 'admissionApplications');
    console.log('Collection reference created:', applicationsRef);
    console.log('Collection path:', applicationsRef.path);
    
    // Test getting documents without any query
    const snapshot = await getDocs(applicationsRef);
    console.log('Collection query successful. Document count:', snapshot.size);
    
    if (snapshot.size > 0) {
      console.log('Sample document IDs:', snapshot.docs.slice(0, 3).map(doc => doc.id));
    }
    
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    throw error;
  }
}

/**
 * Get all admission applications (Admin only)
 * @returns Promise<FirebaseAdmissionApplication[]> - Array of all applications
 */
export async function getAllAdmissionApplications(): Promise<FirebaseAdmissionApplication[]> {
  try {
    console.log('Attempting to fetch admission applications...');
    const applicationsRef = collection(db, 'admissionApplications');
    
    // First try to get all documents without ordering to check if collection exists
    let querySnapshot;
    try {
      const q = query(applicationsRef, orderBy('createdAt', 'desc'));
      querySnapshot = await getDocs(q);
    } catch (orderError) {
      console.warn('Failed to order by createdAt, trying without ordering:', orderError);
      // If ordering fails, try without ordering
      querySnapshot = await getDocs(applicationsRef);
    }
    
    console.log(`Found ${querySnapshot.size} admission applications`);
    
    const applications: FirebaseAdmissionApplication[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Application data:', { id: doc.id, ...data });
      applications.push(data as FirebaseAdmissionApplication);
    });
    
    return applications;
  } catch (error) {
    console.error('Detailed error fetching admission applications:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as { code?: string })?.code,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`Failed to fetch admission applications: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update application status (Admin only)
 * @param applicantId - Applicant ID to update
 * @param status - New status
 * @returns Promise<void>
 */
export async function updateApplicationStatus(
  applicantId: string, 
  status: 'pending' | 'under_review' | 'accepted' | 'rejected'
): Promise<void> {
  try {
    const docRef = doc(db, 'admissionApplications', applicantId);
    await setDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating application status:', error);
    throw new Error('Failed to update application status');
  }
}

/**
 * Add admin response to application (Admin only)
 * @param applicantId - Applicant ID
 * @param response - Admin response text
 * @param adminEmail - Email of the admin who responded
 * @returns Promise<void>
 */
export async function addAdminResponse(
  applicantId: string, 
  response: string,
  adminEmail: string
): Promise<void> {
  try {
    const docRef = doc(db, 'admissionApplications', applicantId);
    await setDoc(docRef, {
      adminResponse: response,
      adminResponseBy: adminEmail,
      adminResponseAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error adding admin response:', error);
    throw new Error('Failed to add admin response');
  }
}

/**
 * Delete admission application (Admin only)
 * @param applicantId - Applicant ID to delete
 * @returns Promise<void>
 */
export async function deleteAdmissionApplication(applicantId: string): Promise<void> {
  try {
    const docRef = doc(db, 'admissionApplications', applicantId);
    
    // Get application data to delete associated files
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Application not found');
    }

    const applicationData = docSnap.data() as FirebaseAdmissionApplication;
    
    // Delete the Firestore document first (this is the critical operation)
    await deleteDoc(docRef);
    
    // Delete associated files from Cloudinary asynchronously (non-blocking)
    // These operations are performed in the background and won't block the UI
    const fileDeletionPromises: Promise<void>[] = [];
    
    if (applicationData.applicationImageUrl) {
      fileDeletionPromises.push(
        deleteAdmissionFileFromCloudinary(applicantId, 'image').catch(error => {
          console.warn(`Failed to delete application image for ${applicantId}:`, error);
          // Don't throw - file deletion failures shouldn't prevent document deletion
        })
      );
    }
    
    if (applicationData.communityRecommendationUrl) {
      fileDeletionPromises.push(
        deleteAdmissionFileFromCloudinary(applicantId, 'recommendation').catch(error => {
          console.warn(`Failed to delete recommendation file for ${applicantId}:`, error);
          // Don't throw - file deletion failures shouldn't prevent document deletion
        })
      );
    }
    
    // Execute file deletions in parallel without waiting for them to complete
    // This improves performance and prevents timeout issues
    if (fileDeletionPromises.length > 0) {
      Promise.all(fileDeletionPromises).catch(error => {
        console.warn('Some file deletions failed, but document was successfully deleted:', error);
      });
    }
    
  } catch (error) {
    console.error('Error deleting admission application:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw new Error('Application not found or already deleted');
      } else if (error.message.includes('permission')) {
        throw new Error('Insufficient permissions to delete application');
      } else {
        throw new Error(`Failed to delete application: ${error.message}`);
      }
    } else {
      throw new Error('Failed to delete admission application');
    }
  }
}
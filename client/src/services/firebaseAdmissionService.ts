import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  uploadAdmissionImage, 
  uploadCommunityRecommendation,
  deleteAdmissionFileFromCloudinary 
} from './cloudinaryService';

export interface AdmissionFormData {
  // Step 1: Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  identificationType: string;
  identificationNumber: string;
  applicationImage?: File;
  applicationImageUrl?: string;
  nationality: string;
  personalComputer: boolean;
  desiredProgram: string;

  // Step 2: Educational Background
  highestEducation: string;
  lastSchoolName: string;
  graduationYear: number;
  basicComputerKnowledge: boolean;
  personalStatement: string;
  communityImpact: string;

  // Step 3: Contact Information
  email: string;
  phoneNumber: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactAddress: string;
  emergencyContactRelationship: string;
  communityRecommendation?: File;
  communityRecommendationUrl?: string;
  declarationAccepted: boolean;

  // System fields
  applicantId?: string;
  status?: 'pending' | 'under_review' | 'accepted' | 'rejected';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirebaseAdmissionApplication {
  applicantId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  identificationType: string;
  identificationNumber: string;
  applicationImageUrl?: string;
  nationality: string;
  personalComputer: boolean;
  desiredProgram: string;
  highestEducation: string;
  lastSchoolName: string;
  graduationYear: number;
  basicComputerKnowledge: boolean;
  personalStatement: string;
  communityImpact: string;
  email: string;
  phoneNumber: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactAddress: string;
  emergencyContactRelationship: string;
  communityRecommendationUrl?: string;
  declarationAccepted: boolean;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected';
  adminResponse?: string;
  adminResponseBy?: string;
  adminResponseAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Check if an application already exists with the given email
 * @param email - Email to check
 * @returns Promise<boolean> - True if email exists
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const admissionsRef = collection(db, 'admissionApplications');
    const emailQuery = query(admissionsRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(emailQuery);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking email existence:', error);
    throw new Error('Failed to check email existence');
  }
}

/**
 * Check for duplicate applications based on personal information
 * @param formData - Form data to check
 * @returns Promise<boolean> - True if duplicate found
 */
export async function checkDuplicateApplication(formData: AdmissionFormData): Promise<boolean> {
  try {
    const admissionsRef = collection(db, 'admissionApplications');
    
    // Check for duplicate based on identification number and date of birth
    const duplicateQuery = query(
      admissionsRef, 
      where('identificationNumber', '==', formData.identificationNumber),
      where('dateOfBirth', '==', formData.dateOfBirth)
    );
    
    const querySnapshot = await getDocs(duplicateQuery);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking duplicate application:', error);
    throw new Error('Failed to check duplicate application');
  }
}

/**
 * Generate unique applicant ID
 * @returns string - Unique applicant ID
 */
export function generateApplicantId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `APP${timestamp}${random}`;
}



/**
 * Upload application image to Cloudinary
 * @param file - Image file
 * @param applicantId - Applicant ID
 * @returns Promise<string> - Cloudinary URL
 */
export async function uploadApplicationImage(file: File, applicantId: string): Promise<string> {
  return uploadAdmissionImage(file, applicantId);
}

/**
 * Upload community recommendation to Cloudinary
 * @param file - Recommendation file
 * @param applicantId - Applicant ID
 * @returns Promise<string> - Cloudinary URL
 */
export async function uploadCommunityRecommendationFile(file: File, applicantId: string): Promise<string> {
  return uploadCommunityRecommendation(file, applicantId);
}

/**
 * Check if applicant ID already exists
 * @param applicantId - Applicant ID to check
 * @returns Promise<boolean> - True if exists, false otherwise
 */
export async function checkApplicantExists(applicantId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'admissionApplications', applicantId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking applicant existence:', error);
    throw new Error('Failed to check applicant existence');
  }
}

/**
 * Submit admission application
 * @param formData - Complete form data
 * @returns Promise<FirebaseAdmissionApplication> - Submitted application
 */
export async function submitAdmissionApplication(formData: AdmissionFormData): Promise<FirebaseAdmissionApplication> {
  // Generate unique applicant ID (declare outside try block for catch block access)
  let applicantId = formData.applicantId || generateApplicantId();
  
  try {
    // Check for duplicate email first
    const emailExists = await checkEmailExists(formData.email);
    if (emailExists) {
      throw new Error('You have already submitted an admission application with this email.');
    }

    // Check for duplicate application based on personal information
    const duplicateExists = await checkDuplicateApplication(formData);
    if (duplicateExists) {
      throw new Error('An admission application with the same identification number and date of birth already exists.');
    }
    
    // Ensure unique applicant ID
    while (await checkApplicantExists(applicantId)) {
      applicantId = generateApplicantId();
    }

    let applicationImageUrl = '';
    let communityRecommendationUrl = '';

    // Upload application image if provided
    if (formData.applicationImage) {
      try {
        applicationImageUrl = await uploadApplicationImage(formData.applicationImage, applicantId);
      } catch (error) {
        console.warn('Failed to upload application image:', error);
        // Continue without image
      }
    }

    // Upload community recommendation if provided
    if (formData.communityRecommendation) {
      try {
        communityRecommendationUrl = await uploadCommunityRecommendationFile(formData.communityRecommendation, applicantId);
      } catch (error) {
        console.warn('Failed to upload community recommendation:', error);
        // Continue without recommendation file
      }
    }

    // Create application document
    const application: Omit<FirebaseAdmissionApplication, 'createdAt' | 'updatedAt'> = {
      applicantId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      identificationType: formData.identificationType,
      identificationNumber: formData.identificationNumber,
      applicationImageUrl,
      nationality: formData.nationality,
      personalComputer: formData.personalComputer,
      desiredProgram: formData.desiredProgram,
      highestEducation: formData.highestEducation,
      lastSchoolName: formData.lastSchoolName,
      graduationYear: formData.graduationYear,
      basicComputerKnowledge: formData.basicComputerKnowledge,
      personalStatement: formData.personalStatement,
      communityImpact: formData.communityImpact,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      address: formData.address,
      emergencyContactName: formData.emergencyContactName,
      emergencyContactPhone: formData.emergencyContactPhone,
      emergencyContactAddress: formData.emergencyContactAddress,
      emergencyContactRelationship: formData.emergencyContactRelationship,
      communityRecommendationUrl,
      declarationAccepted: formData.declarationAccepted,
      status: 'pending'
    };

    // Use applicant ID as document ID
    const docRef = doc(db, 'admissionApplications', applicantId);
    
    // Add timestamps and save to Firestore
    await setDoc(docRef, {
      ...application,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Return the created application with current timestamp
    return {
      ...application,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

  } catch (error) {
    console.error('Error submitting admission application:', error);
    
    // Clean up uploaded files if application submission failed
    if (formData.applicantId || applicantId) {
      const idToUse = formData.applicantId || applicantId;
      try {
        if (formData.applicationImage) {
          await deleteAdmissionFileFromCloudinary(idToUse, 'image');
        }
        if (formData.communityRecommendation) {
          await deleteAdmissionFileFromCloudinary(idToUse, 'recommendation');
        }
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded files:', cleanupError);
      }
    }
    
    throw error;
  }
}


/**
 * Get admission application by applicant ID
 * @param applicantId - Applicant ID to fetch
 * @returns Promise<FirebaseAdmissionApplication | null> - Application data or null if not found
 */
export async function getAdmissionApplication(applicantId: string): Promise<FirebaseAdmissionApplication | null> {
  try {
    const docRef = doc(db, 'admissionApplications', applicantId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as FirebaseAdmissionApplication;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching admission application:', error);
    throw new Error('Failed to fetch admission application');
  }
}



/**
 * Get application by email (for applicant to view their own application)
 * @param email - Applicant email
 * @returns Promise<FirebaseAdmissionApplication | null>
 */
export async function getApplicationByEmail(email: string): Promise<FirebaseAdmissionApplication | null> {
  try {
    const applicationsRef = collection(db, 'admissionApplications');
    const q = query(applicationsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    let foundApplication: FirebaseAdmissionApplication | null = null;
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirebaseAdmissionApplication;
      if (data.email.toLowerCase() === email.toLowerCase()) {
        foundApplication = data;
      }
    });
    
    return foundApplication;
  } catch (error) {
    console.error('Error fetching application by email:', error);
    throw new Error('Failed to fetch application');
  }
}


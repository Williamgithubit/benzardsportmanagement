import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  setDoc
} from 'firebase/firestore';
import { 
  updatePassword, 
  updateEmail, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from 'firebase/auth';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, auth, storage } from '@/services/firebase';
import { 
  TeacherProfile,
  NotificationSettings,
  TeacherPreferences,
  SecuritySettings,
  SystemSettings,
  TeacherSettings,
  UpdateTeacherProfileData,
  UpdateNotificationSettingsData,
  UpdateTeacherPreferencesData,
  UpdateSecuritySettingsData,
  UpdateSystemSettingsData,
  PasswordChangeData,
  AvatarUploadData,
  getDefaultNotificationSettings,
  getDefaultTeacherPreferences,
  getDefaultSecuritySettings,
  getDefaultSystemSettings
} from '@/types/settings';

interface ServiceError extends Error {
  code?: string;
  userFriendlyMessage?: string;
}

export class SettingsService {
  private static readonly PROFILES_COLLECTION = 'teacherProfiles';
  private static readonly NOTIFICATIONS_COLLECTION = 'notificationSettings';
  private static readonly PREFERENCES_COLLECTION = 'teacherPreferences';
  private static readonly SECURITY_COLLECTION = 'securitySettings';
  private static readonly SYSTEM_COLLECTION = 'systemSettings';
  private static readonly AVATARS_FOLDER = 'avatars';

  /**
   * Gets teacher profile with strict validation
   * @throws {ServiceError} When userId is invalid or profile fetch fails
   */
  static async getTeacherProfile(userId: string): Promise<TeacherProfile | null> {
    if (!userId || typeof userId !== 'string') {
      const err = new Error('Invalid user ID provided') as ServiceError;
      err.code = 'INVALID_USER_ID';
      err.userFriendlyMessage = 'Authentication required - please sign in again';
      throw err;
    }

    try {
      const docRef = doc(db, this.PROFILES_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (!data) {
          const err = new Error('Profile document has no data') as ServiceError;
          err.code = 'EMPTY_PROFILE';
          throw err;
        }
        
        return {
          id: docSnap.id,
          userId: data.userId || userId,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          avatar: data.avatar || '',
          bio: data.bio || '',
          department: data.department || '',
          title: data.title || '',
          officeLocation: data.officeLocation || '',
          officeHours: data.officeHours || '',
          specializations: Array.isArray(data.specializations) ? data.specializations : [],
          qualifications: Array.isArray(data.qualifications) ? data.qualifications : [],
          yearsOfExperience: typeof data.yearsOfExperience === 'number' ? data.yearsOfExperience : 0,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        };
      }
      return null;
    } catch (error) {
      console.error(`Failed to fetch profile for user ${userId}:`, error);
      
      const serviceError = error instanceof Error 
        ? error as ServiceError
        : new Error('Failed to fetch profile') as ServiceError;
      
      serviceError.code = serviceError.code || 'PROFILE_FETCH_FAILED';
      serviceError.userFriendlyMessage = serviceError.userFriendlyMessage || 
        'Failed to load profile data. Please try again.';
      
      throw serviceError;
    }
  }

  /**
   * Safely gets current authenticated user's profile
   * @throws {ServiceError} When no user is authenticated
   */
  static async getCurrentTeacherProfile(): Promise<TeacherProfile | null> {
    try {
      const user = auth.currentUser;
      if (!user?.uid) {
        const err = new Error('No authenticated user found') as ServiceError;
        err.code = 'UNAUTHENTICATED';
        err.userFriendlyMessage = 'Please sign in to access your profile';
        throw err;
      }

      return await this.getTeacherProfile(user.uid);
    } catch (error) {
      console.error('Failed to get current teacher profile:', error);
      throw error;
    }
  }

  // Profile Management
  static async createTeacherProfile(userId: string, profileData: Partial<TeacherProfile>): Promise<void> {
    try {
      const profile: Omit<TeacherProfile, 'id'> = {
        userId,
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || '',
        phoneNumber: profileData.phoneNumber,
        avatar: profileData.avatar,
        bio: profileData.bio,
        department: profileData.department,
        title: profileData.title,
        officeLocation: profileData.officeLocation,
        officeHours: profileData.officeHours,
        specializations: profileData.specializations || [],
        qualifications: profileData.qualifications || [],
        yearsOfExperience: profileData.yearsOfExperience,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, this.PROFILES_COLLECTION, userId), profile);
    } catch (error) {
      console.error('Error creating teacher profile:', error);
      throw new Error('Failed to create teacher profile');
    }
  }

  static async updateTeacherProfile(userId: string, updateData: UpdateTeacherProfileData): Promise<void> {
    try {
      const docRef = doc(db, this.PROFILES_COLLECTION, userId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating teacher profile:', error);
      throw new Error('Failed to update teacher profile');
    }
  }

  // Avatar Management
  static async uploadAvatar(uploadData: AvatarUploadData): Promise<string> {
    try {
      const { file, userId } = uploadData;
      const fileExtension = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `${this.AVATARS_FOLDER}/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update profile with new avatar URL
      await this.updateTeacherProfile(userId, { avatar: downloadURL });
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw new Error('Failed to upload avatar');
    }
  }

  static async deleteAvatar(userId: string, avatarUrl: string): Promise<void> {
    try {
      // Delete from storage
      const storageRef = ref(storage, avatarUrl);
      await deleteObject(storageRef);
      
      // Remove from profile
      await this.updateTeacherProfile(userId, { avatar: undefined });
    } catch (error) {
      console.error('Error deleting avatar:', error);
      throw new Error('Failed to delete avatar');
    }
  }

  // Notification Settings
  static async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      const docRef = doc(db, this.NOTIFICATIONS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as NotificationSettings;
      } else {
        // Create default settings
        const defaultSettings = getDefaultNotificationSettings(userId);
        await this.createNotificationSettings(userId, defaultSettings);
        return {
          id: userId,
          ...defaultSettings,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw new Error('Failed to fetch notification settings');
    }
  }

  static async createNotificationSettings(userId: string, settings: Omit<NotificationSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const notificationSettings: Omit<NotificationSettings, 'id'> = {
        ...settings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, this.NOTIFICATIONS_COLLECTION, userId), notificationSettings);
    } catch (error) {
      console.error('Error creating notification settings:', error);
      throw new Error('Failed to create notification settings');
    }
  }

  static async updateNotificationSettings(userId: string, updateData: UpdateNotificationSettingsData): Promise<void> {
    try {
      const docRef = doc(db, this.NOTIFICATIONS_COLLECTION, userId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw new Error('Failed to update notification settings');
    }
  }

  // Teacher Preferences
  static async getTeacherPreferences(userId: string): Promise<TeacherPreferences> {
    try {
      const docRef = doc(db, this.PREFERENCES_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as TeacherPreferences;
      } else {
        // Create default preferences
        const defaultPreferences = getDefaultTeacherPreferences(userId);
        await this.createTeacherPreferences(userId, defaultPreferences);
        return {
          id: userId,
          ...defaultPreferences,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error fetching teacher preferences:', error);
      throw new Error('Failed to fetch teacher preferences');
    }
  }

  static async createTeacherPreferences(userId: string, preferences: Omit<TeacherPreferences, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const teacherPreferences: Omit<TeacherPreferences, 'id'> = {
        ...preferences,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, this.PREFERENCES_COLLECTION, userId), teacherPreferences);
    } catch (error) {
      console.error('Error creating teacher preferences:', error);
      throw new Error('Failed to create teacher preferences');
    }
  }

  static async updateTeacherPreferences(userId: string, updateData: UpdateTeacherPreferencesData): Promise<void> {
    try {
      const docRef = doc(db, this.PREFERENCES_COLLECTION, userId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating teacher preferences:', error);
      throw new Error('Failed to update teacher preferences');
    }
  }

  // Security Settings
  static async getSecuritySettings(userId: string): Promise<SecuritySettings> {
    try {
      const docRef = doc(db, this.SECURITY_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as SecuritySettings;
      } else {
        // Create default security settings
        const defaultSettings = getDefaultSecuritySettings(userId);
        await this.createSecuritySettings(userId, defaultSettings);
        return {
          id: userId,
          ...defaultSettings,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error fetching security settings:', error);
      throw new Error('Failed to fetch security settings');
    }
  }

  static async createSecuritySettings(userId: string, settings: Omit<SecuritySettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const securitySettings: Omit<SecuritySettings, 'id'> = {
        ...settings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, this.SECURITY_COLLECTION, userId), securitySettings);
    } catch (error) {
      console.error('Error creating security settings:', error);
      throw new Error('Failed to create security settings');
    }
  }

  static async updateSecuritySettings(userId: string, updateData: UpdateSecuritySettingsData): Promise<void> {
    try {
      const docRef = doc(db, this.SECURITY_COLLECTION, userId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw new Error('Failed to update security settings');
    }
  }

  // System Settings
  static async getSystemSettings(userId: string): Promise<SystemSettings> {
    try {
      const docRef = doc(db, this.SYSTEM_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as SystemSettings;
      } else {
        // Create default system settings
        const defaultSettings = getDefaultSystemSettings(userId);
        await this.createSystemSettings(userId, defaultSettings);
        return {
          id: userId,
          ...defaultSettings,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw new Error('Failed to fetch system settings');
    }
  }

  static async createSystemSettings(userId: string, settings: Omit<SystemSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const systemSettings: Omit<SystemSettings, 'id'> = {
        ...settings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, this.SYSTEM_COLLECTION, userId), systemSettings);
    } catch (error) {
      console.error('Error creating system settings:', error);
      throw new Error('Failed to create system settings');
    }
  }

  static async updateSystemSettings(userId: string, updateData: UpdateSystemSettingsData): Promise<void> {
    try {
      const docRef = doc(db, this.SYSTEM_COLLECTION, userId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw new Error('Failed to update system settings');
    }
  }

  // Password Management
  static async changePassword(passwordData: PasswordChangeData): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No authenticated user found');
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, passwordData.newPassword);

      // Update last password change date
      await this.updateSecuritySettings(user.uid, {
        lastPasswordChange: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error changing password:', error);
      throw new Error('Failed to change password');
    }
  }

  // Get All Settings
  static async getAllSettings(userId: string): Promise<TeacherSettings> {
    try {
      const [profile, notifications, preferences, security, system] = await Promise.all([
        this.getTeacherProfile(userId),
        this.getNotificationSettings(userId),
        this.getTeacherPreferences(userId),
        this.getSecuritySettings(userId),
        this.getSystemSettings(userId)
      ]);

      // If profile doesn't exist, create a basic one
      if (!profile) {
        const user = auth.currentUser;
        const basicProfile = {
          firstName: user?.displayName?.split(' ')[0] || '',
          lastName: user?.displayName?.split(' ')[1] || '',
          email: user?.email || ''
        };
        await this.createTeacherProfile(userId, basicProfile);
        const newProfile = await this.getTeacherProfile(userId);
        
        return {
          profile: newProfile!,
          notifications,
          preferences,
          security,
          system
        };
      }

      return {
        profile,
        notifications,
        preferences,
        security,
        system
      };
    } catch (error) {
      console.error('Error fetching all settings:', error);
      throw new Error('Failed to fetch settings');
    }
  }

  // Export Settings (for backup)
  static async exportSettings(userId: string): Promise<string> {
    try {
      const settings = await this.getAllSettings(userId);
      return JSON.stringify(settings, null, 2);
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw new Error('Failed to export settings');
    }
  }

  // Reset Settings to Default
  static async resetToDefaults(userId: string): Promise<void> {
    try {
      const defaultNotifications = getDefaultNotificationSettings(userId);
      const defaultPreferences = getDefaultTeacherPreferences(userId);
      const defaultSecurity = getDefaultSecuritySettings(userId);
      const defaultSystem = getDefaultSystemSettings(userId);

      await Promise.all([
        this.createNotificationSettings(userId, defaultNotifications),
        this.createTeacherPreferences(userId, defaultPreferences),
        this.createSecuritySettings(userId, defaultSecurity),
        this.createSystemSettings(userId, defaultSystem)
      ]);
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw new Error('Failed to reset settings');
    }
  }
}

import { persistor } from '../store';
import { clearUser } from './authSlice';
import { AppDispatch } from '../store';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { removeRegisteredFcmToken } from '@/services/fcm';

/**
 * Enhanced logout action that clears both Redux state and persisted data
 */
export const performLogout = () => async (dispatch: AppDispatch) => {
  try {
    console.log('Logging out user...');

    await removeRegisteredFcmToken();
    
    // First sign out from Firebase
    await firebaseSignOut(auth);
    console.log('Firebase logout successful');
    
    // Clear Redux state
    dispatch(clearUser());
    
    // Then purge the persisted state
    await persistor.purge();
    
    console.log('Logout completed successfully - Firebase signed out and persisted data cleared');
  } catch (error) {
    console.error('Error during logout:', error);
    
    // Even if Firebase logout fails, still clear Redux state and purge persisted data
    try {
      dispatch(clearUser());
      await persistor.purge();
      console.log('Redux state cleared and persisted data purged despite logout error');
    } catch (purgeError) {
      console.error('Failed to purge persisted data:', purgeError);
      // Still clear Redux state as fallback
      dispatch(clearUser());
    }
  }
};

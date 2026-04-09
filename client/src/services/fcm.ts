import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "@/services/firebase";

export async function requestFcmToken(vapidKey: string) {
  try {
    const messaging = getMessaging(app);
    const currentToken = await getToken(messaging, { vapidKey });
    return currentToken;
  } catch (err) {
    console.error("Error getting FCM token", err);
    return null;
  }
}

export function onFcmMessage(callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void) {
  const messaging = getMessaging(app);
  onMessage(messaging, callback);
}

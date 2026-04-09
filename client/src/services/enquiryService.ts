import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/services/firebase";
import { NotificationService } from "@/services/notificationService";
import AthleteService from "@/services/athleteService";

export const EnquiryService = {
  async createEnquiry(payload: {
    athleteId: string;
    name: string;
    email?: string;
    phone?: string;
    message?: string;
    createdBy?: string;
  }) {
    // Attempt to resolve athlete name for better admin UX
    let athleteName: string | null = null;
    try {
      const athlete = await AthleteService.getAthleteById(payload.athleteId);
      athleteName = athlete?.name || null;
    } catch (err) {
      // ignore resolution errors; we'll store null and admins can still see athleteId
      console.warn("Failed to resolve athlete name for enquiry", err);
    }

    // Save enquiry (include athleteName for better display in admin)
    const docRef = await addDoc(collection(db, "enquiries"), {
      athleteId: payload.athleteId,
      athleteName: athleteName,
      name: payload.name,
      email: payload.email || null,
      phone: payload.phone || null,
      message: payload.message || null,
      createdBy: payload.createdBy || null,
      createdAt: serverTimestamp(),
    });

    // Create notification for admins
    try {
      await NotificationService.createNotification({
        type: "contact",
        title: `New enquiry for athlete ${athleteName || payload.athleteId}`,
        body: `${payload.name}${
          payload.message ? ": " + payload.message.substring(0, 120) : ""
        }`,
        data: {
          athleteId: payload.athleteId,
          athleteName,
          enquiryId: docRef.id,
        },
        recipientRole: "admin",
      });
    } catch (err) {
      console.error("Failed to create notification for enquiry", err);
    }

    return docRef.id;
  },
};

export default EnquiryService;

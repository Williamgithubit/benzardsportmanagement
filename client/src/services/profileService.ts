import { auth } from "@/services/firebase";

export interface ProfileAvatarUploadResult {
  url: string;
  publicId: string;
}

export const ProfileService = {
  async uploadAvatar(
    file: File,
    previousPublicId?: string | null,
  ): Promise<ProfileAvatarUploadResult> {
    if (!auth.currentUser) {
      throw new Error("You need to sign in before uploading a profile photo.");
    }

    const idToken = await auth.currentUser.getIdToken();
    const formData = new FormData();
    formData.append("file", file);

    if (previousPublicId) {
      formData.append("previousPublicId", previousPublicId);
    }

    const response = await fetch("/api/profile/avatar", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: formData,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || payload?.success === false) {
      throw new Error(
        payload?.error || payload?.message || "Profile image upload failed.",
      );
    }

    return {
      url: payload.url as string,
      publicId: payload.publicId as string,
    };
  },
};

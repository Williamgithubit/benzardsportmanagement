import { auth } from "@/services/firebase";

export async function adminApiFetch<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<T> {
  if (!auth.currentUser) {
    throw new Error("User not authenticated");
  }

  try {
    const idToken = await auth.currentUser.getIdToken(true);
    const headers = new Headers(init.headers);

    headers.set("Authorization", `Bearer ${idToken}`);

    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(input, {
      ...init,
      cache: "no-store",
      headers,
    });

    const data = await response.json().catch(() => null);

    if (
      !response.ok ||
      (data &&
        typeof data === "object" &&
        "success" in data &&
        data.success === false)
    ) {
      throw new Error(
        (data as { error?: string; message?: string } | null)?.error ||
          (data as { error?: string; message?: string } | null)?.message ||
          `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message?.includes("network-request-failed")) {
        throw new Error(
          "Network error: Unable to authenticate. Please check your internet connection.",
        );
      }
      throw error;
    }
    throw new Error("An unknown error occurred");
  }
}

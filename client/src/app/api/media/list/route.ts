import { NextRequest, NextResponse } from "next/server";
import "@/lib/firebase-admin"; // ensure admin SDK initialized
import { getApps } from "firebase-admin/app";
import { getFirestore, Query, DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { MediaFilters } from "@/types/media";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Verify admin SDK
    if (!getApps().length) {
      console.error("Firebase Admin SDK not initialized (media list)");
      return NextResponse.json(
        { success: false, error: "Admin SDK not initialized" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const filters: MediaFilters = {
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      resourceType: searchParams.get("resourceType") || "",
      folder: searchParams.get("folder") || "",
      tags: searchParams.get("tags")
        ? searchParams
            .get("tags")!
            .split(",")
            .filter((t) => t.trim())
        : [],
      entityId: searchParams.get("entityId") || undefined,
      uploadedBy: searchParams.get("uploadedBy") || undefined,
    };

    const db = getFirestore();
    let collectionRef: Query<DocumentData> = db.collection("bsm_media");

    if (filters.category && filters.category !== "") {
      collectionRef = collectionRef.where("category", "==", filters.category);
    }
    if (filters.resourceType && filters.resourceType !== "") {
      collectionRef = collectionRef.where(
        "resourceType",
        "==",
        filters.resourceType
      );
    }
    if (filters.folder && filters.folder !== "") {
      collectionRef = collectionRef.where("folder", "==", filters.folder);
    }
    if (filters.entityId && filters.entityId !== "") {
      collectionRef = collectionRef.where("entityId", "==", filters.entityId);
    }
    if (filters.uploadedBy && filters.uploadedBy !== "") {
      collectionRef = collectionRef.where(
        "uploadedBy",
        "==",
        filters.uploadedBy
      );
    }

    // Order by createdAt desc
    collectionRef = collectionRef.orderBy("createdAt", "desc");

    const snapshot = await collectionRef.get();
    const allAssets: Record<string, unknown>[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      allAssets.push({
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString?.() ||
          new Date().toISOString(),
        updatedAt:
          data.updatedAt?.toDate?.()?.toISOString?.() ||
          new Date().toISOString(),
      });
    });

    // Client-side search/filter
    let filtered = allAssets;
    if (filters.search && filters.search.trim() !== "") {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          (String(a.filename || "")).toLowerCase().includes(term) ||
          (String(a.originalFilename || "")).toLowerCase().includes(term) ||
          (String(a.caption || "")).toLowerCase().includes(term) ||
          (String(a.altText || "")).toLowerCase().includes(term) ||
          (String(a.description || "")).toLowerCase().includes(term) ||
          (Array.isArray(a.tags) &&
            a.tags.some((t: string) => t.toLowerCase().includes(term)))
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(
        (a) =>
          Array.isArray(a.tags) &&
          filters.tags!.some((tag) => (a.tags as string[]).includes(tag))
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: start + limit < total,
      hasPrev: page > 1,
    };

    return NextResponse.json({ success: true, assets: paged, pagination });
  } catch (error) {
    console.error("Error fetching media assets (server):", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch media assets",
      },
      { status: 500 }
    );
  }
}

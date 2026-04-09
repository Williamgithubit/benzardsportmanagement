import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import {
  getDateFromValue,
  requireAdminRequest,
  serializeFirestoreValue,
} from "@/lib/admin-route-utils";

export const runtime = "nodejs";

const toTimestamp = (value: unknown) => getDateFromValue(value)?.getTime() ?? 0;

export async function GET(request: NextRequest) {
  const authResult = await requireAdminRequest(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const snapshot = await getFirestore().collection("blogPosts").get();
    const posts = (snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...(serializeFirestoreValue(doc.data()) as Record<string, unknown>),
      })) as Array<Record<string, unknown>>)
      .sort(
        (left, right) =>
          toTimestamp(right.updatedAt ?? right.createdAt) -
          toTimestamp(left.updatedAt ?? left.createdAt)
      );

    const categories = Array.from(
      new Set(
        posts
          .map((post) => post.category)
          .filter(
            (category): category is string =>
              typeof category === "string" && category.trim().length > 0
          )
      )
    ).sort((left, right) => left.localeCompare(right));

    const tags = Array.from(
      new Set(
        posts.flatMap((post) =>
          Array.isArray(post.tags)
            ? post.tags.filter(
                (tag): tag is string =>
                  typeof tag === "string" && tag.trim().length > 0
              )
            : []
        )
      )
    ).sort((left, right) => left.localeCompare(right));

    return NextResponse.json({
      success: true,
      posts,
      categories,
      tags,
    });
  } catch (error) {
    console.error("Failed to load admin blog posts:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load blog posts",
      },
      { status: 500 }
    );
  }
}

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import {
  createBlogPost,
  deleteBlogPost,
  updateBlogPost,
} from "@/services/blogService";
import { CoachService } from "@/services/coachService";
import {
  createEvent,
  deleteEvent,
  updateEvent,
} from "@/services/eventService";
import { NotificationService } from "@/services/notificationService";
import {
  deleteMediaAsset,
  uploadMediaToBSM,
} from "@/services/cloudinaryService";
import type { TeamAnnouncementRecord, TeamMediaRecord, TeamPostRecord } from "@/types/media-dashboard";
import type { MatchRecord, PlayerRecord } from "@/types/sports";
import {
  sortByNewest,
  toIsoString,
  type FirestoreDateValue,
} from "@/utils/firestore";

const POSTS_COLLECTION = "posts";
const BLOG_POSTS_COLLECTION = "blogPosts";
const EVENTS_COLLECTION = "events";
const MEDIA_COLLECTION = "media";
const ANNOUNCEMENTS_COLLECTION = "announcements";

const teamCollection = (collectionName: string, teamId: string | null) =>
  teamId
    ? query(collection(db, collectionName), where("teamId", "==", teamId))
    : collection(db, collectionName);

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const buildExcerpt = (content: string, maxLength = 180) => {
  const plainText = stripHtml(content);
  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, maxLength).trim()}...`;
};

const normalizeBlogCategory = (type: TeamPostRecord["type"]) => {
  switch (type) {
    case "announcement":
      return "announcements";
    case "match_report":
      return "match_report";
    case "event":
      return "events";
    default:
      return "general";
  }
};

const inferBlogPostType = (data: Record<string, unknown>): TeamPostRecord["type"] => {
  const category =
    typeof data.category === "string" ? data.category.toLowerCase() : "";

  if (category.includes("match")) {
    return "match_report";
  }

  if (category.includes("announcement")) {
    return "announcement";
  }

  return "blog";
};

const mapMediaStatusToBlogStatus = (status: TeamPostRecord["status"]) =>
  status === "published" ? "published" : "draft";

const mapMediaStatusToEventStatus = (
  status: TeamPostRecord["status"],
  scheduledFor?: string | null,
) => {
  if (status === "draft") {
    return "cancelled" as const;
  }

  const scheduledTime = scheduledFor ? new Date(scheduledFor).getTime() : Number.NaN;
  if (status === "published" && Number.isFinite(scheduledTime) && scheduledTime <= Date.now()) {
    return "ongoing" as const;
  }

  return "upcoming" as const;
};

const resolveEventWindow = (scheduledFor?: string | null) => {
  const startDate = scheduledFor ? new Date(scheduledFor) : new Date();
  const safeStartDate = Number.isNaN(startDate.getTime()) ? new Date() : startDate;
  const endDate = new Date(safeStartDate.getTime() + 2 * 60 * 60 * 1000);

  return {
    startDate: safeStartDate,
    endDate,
  };
};

const normalizePost = (
  id: string,
  data: Record<string, unknown>,
): TeamPostRecord => ({
  id,
  teamId: typeof data.teamId === "string" ? data.teamId : "",
  sourceCollection: POSTS_COLLECTION,
  sourceId: id,
  type:
    data.type === "event" ||
    data.type === "match_report" ||
    data.type === "announcement"
      ? data.type
      : "blog",
  status:
    data.status === "scheduled" || data.status === "published"
      ? data.status
      : "draft",
  title: (typeof data.title === "string" && data.title.trim()) || "Untitled post",
  content: typeof data.content === "string" ? data.content : "",
  mediaIds: Array.isArray(data.mediaIds)
    ? data.mediaIds.filter(
        (mediaId): mediaId is string =>
          typeof mediaId === "string" && Boolean(mediaId.trim()),
      )
    : [],
  publishedAt: toIsoString(data.publishedAt as FirestoreDateValue),
  scheduledFor: toIsoString(data.scheduledFor as FirestoreDateValue),
  createdBy: typeof data.createdBy === "string" ? data.createdBy : null,
  createdAt: toIsoString(data.createdAt as FirestoreDateValue),
  updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
  views: typeof data.views === "number" ? data.views : 0,
});

const legacyMatchesTeam = (
  data: Record<string, unknown>,
  teamId: string | null,
) => {
  if (!teamId) {
    return true;
  }

  return (
    typeof data.teamId !== "string" ||
    !data.teamId.trim() ||
    data.teamId === teamId
  );
};

const normalizeBlogPost = (
  id: string,
  data: Record<string, unknown>,
): TeamPostRecord => {
  const author =
    data.author && typeof data.author === "object"
      ? (data.author as Record<string, unknown>)
      : null;

  return {
    id,
    teamId: typeof data.teamId === "string" ? data.teamId : "",
    sourceCollection: BLOG_POSTS_COLLECTION,
    sourceId: id,
    type: inferBlogPostType(data),
    status: data.status === "published" ? "published" : "draft",
    title:
      (typeof data.title === "string" && data.title.trim()) || "Untitled post",
    content:
      typeof data.content === "string"
        ? data.content
        : typeof data.excerpt === "string"
          ? data.excerpt
          : "",
    mediaIds: Array.isArray(data.mediaIds)
      ? data.mediaIds.filter(
          (mediaId): mediaId is string =>
            typeof mediaId === "string" && Boolean(mediaId.trim()),
        )
      : [],
    publishedAt: toIsoString(data.publishedAt as FirestoreDateValue),
    scheduledFor: null,
    createdBy: author && typeof author.id === "string" ? author.id : null,
    createdAt: toIsoString(data.createdAt as FirestoreDateValue),
    updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
    views: typeof data.views === "number" ? data.views : 0,
  };
};

const normalizeEventPost = (
  id: string,
  data: Record<string, unknown>,
): TeamPostRecord => ({
  id,
  teamId: typeof data.teamId === "string" ? data.teamId : "",
  sourceCollection: EVENTS_COLLECTION,
  sourceId: id,
  type: "event",
  status:
    data.status === "upcoming"
      ? "scheduled"
      : data.status === "cancelled"
        ? "draft"
        : "published",
  title:
    (typeof data.title === "string" && data.title.trim()) || "Untitled event",
  content: typeof data.description === "string" ? data.description : "",
  mediaIds: [],
  publishedAt: null,
  scheduledFor: toIsoString(data.startDate as FirestoreDateValue),
  createdBy: typeof data.createdBy === "string" ? data.createdBy : null,
  createdAt: toIsoString(data.createdAt as FirestoreDateValue),
  updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
  views: typeof data.registrations === "number" ? data.registrations : 0,
});

const normalizeMedia = (
  id: string,
  data: Record<string, unknown>,
): TeamMediaRecord => ({
  id,
  teamId: typeof data.teamId === "string" ? data.teamId : "",
  type: data.type === "video" ? "video" : "image",
  url: typeof data.url === "string" ? data.url : "",
  publicId: typeof data.publicId === "string" ? data.publicId : null,
  title: typeof data.title === "string" ? data.title : null,
  tags: Array.isArray(data.tags)
    ? data.tags.filter(
        (tag): tag is string => typeof tag === "string" && Boolean(tag.trim()),
      )
    : [],
  matchId: typeof data.matchId === "string" ? data.matchId : null,
  playerId: typeof data.playerId === "string" ? data.playerId : null,
  eventId: typeof data.eventId === "string" ? data.eventId : null,
  uploadedBy: typeof data.uploadedBy === "string" ? data.uploadedBy : null,
  createdAt: toIsoString(data.createdAt as FirestoreDateValue),
  updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
});

const normalizeAnnouncement = (
  id: string,
  data: Record<string, unknown>,
): TeamAnnouncementRecord => ({
  id,
  teamId: typeof data.teamId === "string" ? data.teamId : "",
  title:
    (typeof data.title === "string" && data.title.trim()) || "Announcement",
  content: typeof data.content === "string" ? data.content : "",
  audiences: Array.isArray(data.audiences)
    ? data.audiences.filter(
        (audience): audience is "players" | "staff" =>
          audience === "players" || audience === "staff",
      )
    : ["players"],
  createdBy: typeof data.createdBy === "string" ? data.createdBy : null,
  createdAt: toIsoString(data.createdAt as FirestoreDateValue),
  updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
});

const resolveAnnouncementRoles = (audiences: Array<"players" | "staff">) => {
  const roles = new Set<string>();

  if (audiences.includes("players")) {
    roles.add("athlete");
  }

  if (audiences.includes("staff")) {
    ["admin", "manager", "coach", "statistician", "media"].forEach((role) =>
      roles.add(role),
    );
  }

  return [...roles];
};

export const MediaDashboardService = {
  subscribeToPosts(
    teamId: string | null,
    callback: (posts: TeamPostRecord[]) => void,
    onError?: (error: unknown) => void,
  ) {
    const postBuckets: Record<"native" | "blog" | "event", TeamPostRecord[]> = {
      native: [],
      blog: [],
      event: [],
    };

    const publishPosts = () => {
      callback(
        [...postBuckets.native, ...postBuckets.blog, ...postBuckets.event].sort(
          sortByNewest,
        ),
      );
    };

    const unsubscribers = [
      onSnapshot(
        teamCollection(POSTS_COLLECTION, teamId),
        (snapshot) => {
          postBuckets.native = snapshot.docs.map((entry) =>
            normalizePost(entry.id, entry.data() as Record<string, unknown>),
          );
          publishPosts();
        },
        onError,
      ),
      onSnapshot(
        collection(db, BLOG_POSTS_COLLECTION),
        (snapshot) => {
          postBuckets.blog = snapshot.docs
            .map((entry) => ({
              id: entry.id,
              data: entry.data() as Record<string, unknown>,
            }))
            .filter((entry) => legacyMatchesTeam(entry.data, teamId))
            .map((entry) => normalizeBlogPost(entry.id, entry.data));
          publishPosts();
        },
        onError,
      ),
      onSnapshot(
        collection(db, EVENTS_COLLECTION),
        (snapshot) => {
          postBuckets.event = snapshot.docs
            .map((entry) => ({
              id: entry.id,
              data: entry.data() as Record<string, unknown>,
            }))
            .filter((entry) => legacyMatchesTeam(entry.data, teamId))
            .map((entry) => normalizeEventPost(entry.id, entry.data));
          publishPosts();
        },
        onError,
      ),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  },

  subscribeToMedia(
    teamId: string | null,
    callback: (items: TeamMediaRecord[]) => void,
    onError?: (error: unknown) => void,
  ) {
    return onSnapshot(
      teamCollection(MEDIA_COLLECTION, teamId),
      (snapshot) => {
        callback(
          snapshot.docs
            .map((entry) =>
              normalizeMedia(entry.id, entry.data() as Record<string, unknown>),
            )
            .sort(sortByNewest),
        );
      },
      onError,
    );
  },

  subscribeToAnnouncements(
    teamId: string | null,
    callback: (items: TeamAnnouncementRecord[]) => void,
    onError?: (error: unknown) => void,
  ) {
    return onSnapshot(
      teamCollection(ANNOUNCEMENTS_COLLECTION, teamId),
      (snapshot) => {
        callback(
          snapshot.docs
            .map((entry) =>
              normalizeAnnouncement(
                entry.id,
                entry.data() as Record<string, unknown>,
              ),
            )
            .sort(sortByNewest),
        );
      },
      onError,
    );
  },

  subscribeToPlayerProfiles(
    teamId: string | null,
    callback: (items: PlayerRecord[]) => void,
    onError?: (error: unknown) => void,
  ) {
    return CoachService.subscribeToPlayers(teamId, callback, onError);
  },

  subscribeToMatches(
    teamId: string | null,
    callback: (items: MatchRecord[]) => void,
    onError?: (error: unknown) => void,
  ) {
    return CoachService.subscribeToMatches(teamId, callback, onError);
  },

  async createPost(
    teamId: string,
    payload: Omit<
      TeamPostRecord,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "teamId"
      | "publishedAt"
      | "sourceCollection"
      | "sourceId"
    > & {
      excerpt?: string;
      category?: string;
      tags?: string[];
      featuredImage?: string | null;
      authorName?: string | null;
      authorEmail?: string | null;
    },
  ) {
    if (payload.type === "event") {
      const { startDate, endDate } = resolveEventWindow(payload.scheduledFor);

      return createEvent({
        title: payload.title,
        description: payload.content,
        startDate,
        endDate,
        location: "To be announced",
        capacity: 0,
        status: mapMediaStatusToEventStatus(payload.status, payload.scheduledFor),
        category: "other",
        price: 0,
        isPublic: payload.status !== "draft",
        teamId,
        createdBy: payload.createdBy || null,
      });
    }

    if (
      payload.type === "blog" ||
      payload.type === "match_report" ||
      payload.type === "announcement"
    ) {
      return createBlogPost(
        {
          title: payload.title,
          content: payload.content,
          excerpt: payload.excerpt || buildExcerpt(payload.content),
          mediaIds: payload.mediaIds,
          featuredImage: payload.featuredImage || undefined,
          category: payload.category || normalizeBlogCategory(payload.type),
          tags: payload.tags || [],
          status: mapMediaStatusToBlogStatus(payload.status),
          featured: false,
          teamId,
        },
        payload.createdBy || "media-dashboard",
        payload.authorName || "Media Team",
        payload.authorEmail || "media@benzard.local",
      );
    }

    const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
      ...payload,
      teamId,
      publishedAt:
        payload.status === "published" ? serverTimestamp() : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      views: 0,
    });

    return docRef.id;
  },

  async updatePost(
    post: TeamPostRecord,
    updates: Partial<
      Omit<
        TeamPostRecord,
        | "id"
        | "teamId"
        | "createdAt"
        | "updatedAt"
        | "sourceCollection"
        | "sourceId"
      >
    > & {
      excerpt?: string;
      category?: string;
      tags?: string[];
      featuredImage?: string | null;
    },
  ) {
    const sourceId = post.sourceId || post.id;

    if (post.sourceCollection === BLOG_POSTS_COLLECTION) {
      await updateBlogPost({
        id: sourceId,
        ...(typeof updates.title === "string" ? { title: updates.title } : {}),
        ...(typeof updates.content === "string"
          ? { content: updates.content }
          : {}),
        ...(typeof updates.content === "string" || typeof updates.excerpt === "string"
          ? {
              excerpt:
                updates.excerpt ||
                (typeof updates.content === "string"
                  ? buildExcerpt(updates.content)
                  : buildExcerpt(post.content)),
            }
          : {}),
        ...(updates.status
          ? {
              status: mapMediaStatusToBlogStatus(updates.status),
            }
          : {}),
        ...(Array.isArray(updates.mediaIds) ? { mediaIds: updates.mediaIds } : {}),
        ...(typeof updates.featuredImage === "string"
          ? { featuredImage: updates.featuredImage }
          : {}),
        ...(typeof updates.category === "string"
          ? { category: updates.category }
          : typeof updates.type === "string"
            ? { category: normalizeBlogCategory(updates.type) }
            : {}),
        ...(Array.isArray(updates.tags) ? { tags: updates.tags } : {}),
        ...(post.teamId ? { teamId: post.teamId } : {}),
      });
      return;
    }

    if (post.sourceCollection === EVENTS_COLLECTION) {
      const nextScheduledFor = updates.scheduledFor || post.scheduledFor || null;
      const { startDate, endDate } = resolveEventWindow(nextScheduledFor);

      await updateEvent(sourceId, {
        ...(typeof updates.title === "string" ? { title: updates.title } : {}),
        ...(typeof updates.content === "string"
          ? { description: updates.content }
          : {}),
        ...(updates.status
          ? {
              status: mapMediaStatusToEventStatus(updates.status, nextScheduledFor),
            }
          : {}),
        ...(nextScheduledFor ? { startDate, endDate } : {}),
        ...(post.teamId ? { teamId: post.teamId } : {}),
      });
      return;
    }

    await updateDoc(doc(db, POSTS_COLLECTION, sourceId), {
      ...updates,
      ...(updates.status === "published" ? { publishedAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    });
  },

  async deletePost(post: TeamPostRecord) {
    const sourceId = post.sourceId || post.id;

    if (post.sourceCollection === BLOG_POSTS_COLLECTION) {
      await deleteBlogPost(sourceId);
      return;
    }

    if (post.sourceCollection === EVENTS_COLLECTION) {
      await deleteEvent(sourceId);
      return;
    }

    await deleteDoc(doc(db, POSTS_COLLECTION, sourceId));
  },

  async publishDuePosts(teamId: string) {
    const scheduledPostsSnapshot = await getDocs(
      query(
        collection(db, POSTS_COLLECTION),
        where("teamId", "==", teamId),
        where("status", "==", "scheduled"),
      ),
    );

    const now = Date.now();
    await Promise.all(
      scheduledPostsSnapshot.docs.map(async (entry) => {
        const post = normalizePost(
          entry.id,
          entry.data() as Record<string, unknown>,
        );
        const scheduledForTime = post.scheduledFor
          ? new Date(post.scheduledFor).getTime()
          : 0;

        if (!scheduledForTime || scheduledForTime > now) {
          return;
        }

        await updateDoc(doc(db, POSTS_COLLECTION, post.id), {
          status: "published",
          publishedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }),
    );
  },

  async uploadTeamMedia(
    teamId: string,
    payload: {
      file: File;
      uploadedBy: string;
      title?: string;
      tags?: string[];
      matchId?: string | null;
      playerId?: string | null;
      eventId?: string | null;
    },
  ) {
    const asset = await uploadMediaToBSM(payload.file, {
      folder: "bsm/team-media",
      category: "general",
      tags: payload.tags || [],
      entityId: payload.playerId || payload.matchId || payload.eventId || undefined,
      entityType: payload.playerId
        ? "player"
        : payload.matchId
          ? "match"
          : payload.eventId
            ? "event"
            : undefined,
      caption: payload.title,
      altText: payload.title,
      description: payload.title,
    });

    const mediaRef = await addDoc(collection(db, MEDIA_COLLECTION), {
      teamId,
      type: asset.resourceType === "video" ? "video" : "image",
      url: asset.secureUrl || asset.url,
      publicId: asset.publicId,
      title: payload.title || asset.originalFilename,
      tags: payload.tags || [],
      matchId: payload.matchId || null,
      playerId: payload.playerId || null,
      eventId: payload.eventId || null,
      uploadedBy: payload.uploadedBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return mediaRef.id;
  },

  async deleteTeamMedia(media: TeamMediaRecord) {
    if (media.publicId) {
      await deleteMediaAsset(media.publicId, media.type);
    }

    await deleteDoc(doc(db, MEDIA_COLLECTION, media.id));
  },

  async createAnnouncement(
    teamId: string,
    payload: Omit<TeamAnnouncementRecord, "id" | "createdAt" | "updatedAt" | "teamId">,
  ) {
    const announcementRef = await addDoc(collection(db, ANNOUNCEMENTS_COLLECTION), {
      ...payload,
      teamId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await NotificationService.createRoleNotifications(
      resolveAnnouncementRoles(payload.audiences),
      {
        teamId,
        type: "system_alert",
        title: payload.title,
        message: payload.content,
        data: {
          priority: "high",
          actionUrl: "/dashboard/media#announcements",
          actionLabel: "Open announcements",
          announcementId: announcementRef.id,
        },
      },
    );

    return announcementRef.id;
  },

  async syncMediaNotifications(
    teamId: string,
    players: PlayerRecord[],
    matches: MatchRecord[],
    posts: TeamPostRecord[],
  ) {
    const now = Date.now();
    const upcomingReminders = posts.filter((post) => {
      if (post.status !== "scheduled" || !post.scheduledFor) {
        return false;
      }

      const scheduledTime = new Date(post.scheduledFor).getTime();
      if (Number.isNaN(scheduledTime) || scheduledTime <= now) {
        return false;
      }

      return scheduledTime - now <= 24 * 60 * 60 * 1000;
    });

    await Promise.all([
      ...players.slice(0, 10).map((player) =>
        NotificationService.createRoleNotifications(["media"], {
          teamId,
          type: "athlete",
          title: "New player profile available",
          message: `${player.fullName} is ready for coverage and media tagging.`,
          data: {
            playerId: player.id,
            priority: "low",
            actionUrl: "/dashboard/media#media-library",
            actionLabel: "Open media library",
          },
          dedupeKey: `media-player:${player.id}`,
        }),
      ),
      ...matches
        .filter((match) => match.status === "scheduled")
        .slice(0, 10)
        .map((match) =>
          NotificationService.createRoleNotifications(["media"], {
            teamId,
            type: "event",
            title: "New match added",
            message: `${match.title} is ready for media planning.`,
            data: {
              matchId: match.id,
              priority: "medium",
              actionUrl: "/dashboard/media#posts",
              actionLabel: "Plan coverage",
            },
            dedupeKey: `media-match:${match.id}`,
          }),
        ),
      ...upcomingReminders.map((post) =>
        NotificationService.createRoleNotifications(["media"], {
          teamId,
          type: "system_alert",
          title: "Content reminder",
          message: `${post.title} is scheduled soon and ready for final review.`,
          data: {
            postId: post.id,
            priority: "medium",
            actionUrl: "/dashboard/media#posts",
            actionLabel: "Review post",
          },
          dedupeKey: `media-reminder:${post.id}:${post.scheduledFor}`,
        }),
      ),
    ]);
  },
};

export default MediaDashboardService;

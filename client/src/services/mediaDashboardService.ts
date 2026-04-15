import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { CoachService } from "@/services/coachService";
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
const MEDIA_COLLECTION = "media";
const ANNOUNCEMENTS_COLLECTION = "announcements";

const teamCollection = (collectionName: string, teamId: string | null) =>
  teamId
    ? query(collection(db, collectionName), where("teamId", "==", teamId))
    : collection(db, collectionName);

const normalizePost = (
  id: string,
  data: Record<string, unknown>,
): TeamPostRecord => ({
  id,
  teamId: typeof data.teamId === "string" ? data.teamId : "",
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
    return onSnapshot(
      teamCollection(POSTS_COLLECTION, teamId),
      (snapshot) => {
        callback(
          snapshot.docs
            .map((entry) =>
              normalizePost(entry.id, entry.data() as Record<string, unknown>),
            )
            .sort(sortByNewest),
        );
      },
      onError,
    );
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
    payload: Omit<TeamPostRecord, "id" | "createdAt" | "updatedAt" | "teamId" | "publishedAt">,
  ) {
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
    postId: string,
    updates: Partial<Omit<TeamPostRecord, "id" | "teamId" | "createdAt" | "updatedAt">>,
  ) {
    await updateDoc(doc(db, POSTS_COLLECTION, postId), {
      ...updates,
      ...(updates.status === "published" ? { publishedAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    });
  },

  async deletePost(postId: string) {
    await deleteDoc(doc(db, POSTS_COLLECTION, postId));
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

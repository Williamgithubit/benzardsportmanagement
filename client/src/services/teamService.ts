import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { User } from "@/types/auth";
import type { TeamContext, TeamRecord } from "@/types/team";
import { toIsoString, type FirestoreDateValue } from "@/utils/firestore";

const TEAMS_COLLECTION = "teams";
const USERS_COLLECTION = "users";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const normalizeTeam = (
  id: string,
  data: Record<string, unknown>,
): TeamRecord => ({
  id,
  name:
    (typeof data.name === "string" && data.name.trim()) || "Team Workspace",
  slug:
    (typeof data.slug === "string" && data.slug.trim()) ||
    slugify(
      (typeof data.name === "string" && data.name.trim()) || "team-workspace",
    ),
  createdBy: typeof data.createdBy === "string" ? data.createdBy : null,
  memberIds: Array.isArray(data.memberIds)
    ? data.memberIds.filter(
        (memberId): memberId is string =>
          typeof memberId === "string" && Boolean(memberId.trim()),
      )
    : [],
  staffIds: Array.isArray(data.staffIds)
    ? data.staffIds.filter(
        (staffId): staffId is string =>
          typeof staffId === "string" && Boolean(staffId.trim()),
      )
    : [],
  coachIds: Array.isArray(data.coachIds)
    ? data.coachIds.filter(
        (coachId): coachId is string =>
          typeof coachId === "string" && Boolean(coachId.trim()),
      )
    : [],
  createdAt: toIsoString(data.createdAt as FirestoreDateValue),
  updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
});

const resolveUserTeamId = (user: User | null | undefined) => {
  if (!user) {
    return null;
  }

  if (typeof user.teamId === "string" && user.teamId.trim()) {
    return user.teamId.trim();
  }

  if (Array.isArray(user.teamIds)) {
    const firstTeamId = user.teamIds.find(
      (teamId) => typeof teamId === "string" && Boolean(teamId.trim()),
    );

    if (firstTeamId) {
      return firstTeamId;
    }
  }

  return null;
};

const extractTeamIds = (
  source:
    | { teamId?: string | null; teamIds?: unknown }
    | Record<string, unknown>
    | null
    | undefined,
) => {
  const ids: string[] = [];

  if (
    source &&
    "teamId" in source &&
    typeof source.teamId === "string" &&
    source.teamId.trim()
  ) {
    ids.push(source.teamId.trim());
  }

  if (source && "teamIds" in source && Array.isArray(source.teamIds)) {
    source.teamIds.forEach((teamId) => {
      if (typeof teamId === "string" && teamId.trim()) {
        ids.push(teamId.trim());
      }
    });
  }

  return [...new Set(ids)];
};

const getUserDisplayTeamName = (user: User) => {
  const baseName =
    user.displayName || user.name || user.email?.split("@")[0] || "Team";
  return `${baseName} Team`;
};

const canBootstrapTeam = (user: User) =>
  ["admin", "manager", "coach", "statistician", "media"].includes(user.role);

const normalizeTeamIds = (teamId: string, teamIds?: string[]) =>
  [...new Set([...(teamIds || []), teamId])].filter(
    (entry): entry is string => typeof entry === "string" && Boolean(entry.trim()),
  );

const buildUserTeamProfilePatch = (user: User, teamId: string) => {
  const fallbackName =
    user.displayName || user.name || user.email?.split("@")[0] || "User";
  const now = new Date().toISOString();

  return {
    uid: user.uid,
    email: user.email || null,
    name: user.name || fallbackName,
    displayName: user.displayName || user.name || fallbackName,
    role: user.role,
    status: user.status || "active",
    teamId,
    teamIds: normalizeTeamIds(teamId, user.teamIds),
    photoURL: user.photoURL || null,
    photoPublicId: user.photoPublicId || null,
    phoneNumber: user.phoneNumber || null,
    address: user.address || null,
    bio: user.bio || null,
    emailVerified: Boolean(user.emailVerified),
    metadata: user.metadata || {},
    providerData: user.providerData || [],
    createdAt: user.createdAt || now,
    updatedAt: now,
    lastLoginAt: user.lastLoginAt || user.metadata?.lastSignInTime || now,
  };
};

const persistResolvedTeamContext = async (user: User, teamId: string) => {
  try {
    await setDoc(
      doc(db, USERS_COLLECTION, user.uid),
      buildUserTeamProfilePatch(user, teamId),
      { merge: true },
    );
  } catch (error) {
    console.warn("Unable to persist the resolved team context to users/{uid}.", error);
  }
};

const isUserAssignedToTeam = (team: TeamRecord, userId: string) =>
  team.createdBy === userId ||
  Boolean(team.memberIds?.includes(userId)) ||
  Boolean(team.staffIds?.includes(userId)) ||
  Boolean(team.coachIds?.includes(userId));

const isLegacyTeamRecord = (team: TeamRecord) =>
  !team.createdBy &&
  (team.memberIds?.length || 0) === 0 &&
  (team.staffIds?.length || 0) === 0 &&
  (team.coachIds?.length || 0) === 0;

const getValidatedTeamContext = async (
  user: User,
  candidateTeamIds: string[],
): Promise<TeamContext | null> => {
  for (const candidateTeamId of candidateTeamIds) {
    const teamDoc = await getDoc(doc(db, TEAMS_COLLECTION, candidateTeamId)).catch(
      () => null,
    );

    if (!teamDoc?.exists()) {
      continue;
    }

    const team = normalizeTeam(
      teamDoc.id,
      teamDoc.data() as Record<string, unknown>,
    );

    if (!isUserAssignedToTeam(team, user.uid) && !isLegacyTeamRecord(team)) {
      continue;
    }

    await persistResolvedTeamContext(user, team.id);

    return {
      teamId: team.id,
      team,
    };
  }

  return null;
};

export const TeamService = {
  getResolvedTeamId: resolveUserTeamId,

  async ensureTeamContext(user: User | null | undefined): Promise<TeamContext | null> {
    if (!user?.uid) {
      return null;
    }

    const candidateTeamIds = extractTeamIds(user);

    if (candidateTeamIds.length === 0) {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, user.uid));
      if (userDoc.exists()) {
        extractTeamIds(userDoc.data() as Record<string, unknown>).forEach((teamId) => {
          candidateTeamIds.push(teamId);
        });
      }
    }

    const validatedTeamContext = await getValidatedTeamContext(
      user,
      candidateTeamIds,
    );

    if (validatedTeamContext) {
      return validatedTeamContext;
    }

    const membershipQueries = [
      query(collection(db, TEAMS_COLLECTION), where("createdBy", "==", user.uid), limit(1)),
      query(collection(db, TEAMS_COLLECTION), where("memberIds", "array-contains", user.uid), limit(1)),
      query(collection(db, TEAMS_COLLECTION), where("staffIds", "array-contains", user.uid), limit(1)),
      query(collection(db, TEAMS_COLLECTION), where("coachIds", "array-contains", user.uid), limit(1)),
    ];

    for (const membershipQuery of membershipQueries) {
      const snapshot = await getDocs(membershipQuery);
      if (!snapshot.empty) {
        const teamDoc = snapshot.docs[0];
        await persistResolvedTeamContext(user, teamDoc.id);

        return {
          teamId: teamDoc.id,
          team: normalizeTeam(
            teamDoc.id,
            teamDoc.data() as Record<string, unknown>,
          ),
        };
      }
    }

    const existingTeamSnapshot = await getDocs(
      query(collection(db, TEAMS_COLLECTION), limit(1)),
    );

    if (!existingTeamSnapshot.empty) {
      const teamDoc = existingTeamSnapshot.docs[0];
      await Promise.all([
        persistResolvedTeamContext(user, teamDoc.id),
        updateDoc(doc(db, TEAMS_COLLECTION, teamDoc.id), {
          memberIds: arrayUnion(user.uid),
          staffIds: arrayUnion(user.uid),
          ...(user.role === "coach" ? { coachIds: arrayUnion(user.uid) } : {}),
          updatedAt: serverTimestamp(),
        }).catch(() => undefined),
      ]);

      return {
        teamId: teamDoc.id,
        team: normalizeTeam(
          teamDoc.id,
          teamDoc.data() as Record<string, unknown>,
        ),
      };
    }

    if (!canBootstrapTeam(user)) {
      return null;
    }

    const teamName = getUserDisplayTeamName(user);
    const createdTeamRef = await addDoc(collection(db, TEAMS_COLLECTION), {
      name: teamName,
      slug: slugify(teamName),
      createdBy: user.uid,
      memberIds: [user.uid],
      staffIds: [user.uid],
      coachIds: user.role === "coach" ? [user.uid] : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await persistResolvedTeamContext(user, createdTeamRef.id);

    const createdTeam = await getDoc(doc(db, TEAMS_COLLECTION, createdTeamRef.id));

    return {
      teamId: createdTeamRef.id,
      team: createdTeam.exists()
        ? normalizeTeam(
            createdTeam.id,
            createdTeam.data() as Record<string, unknown>,
          )
        : {
            id: createdTeamRef.id,
            name: teamName,
            slug: slugify(teamName),
            createdBy: user.uid,
            memberIds: [user.uid],
            staffIds: [user.uid],
            coachIds: user.role === "coach" ? [user.uid] : [],
          },
    };
  },
};

export default TeamService;

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

const getUserDisplayTeamName = (user: User) => {
  const baseName =
    user.displayName || user.name || user.email?.split("@")[0] || "Team";
  return `${baseName} Team`;
};

const canBootstrapTeam = (user: User) =>
  ["admin", "manager", "coach", "statistician", "media"].includes(user.role);

export const TeamService = {
  getResolvedTeamId: resolveUserTeamId,

  async ensureTeamContext(user: User | null | undefined): Promise<TeamContext | null> {
    if (!user?.uid) {
      return null;
    }

    let resolvedTeamId = resolveUserTeamId(user);

    if (!resolvedTeamId) {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as Record<string, unknown>;
        if (typeof userData.teamId === "string" && userData.teamId.trim()) {
          resolvedTeamId = userData.teamId.trim();
        } else if (Array.isArray(userData.teamIds)) {
          const firstTeamId = userData.teamIds.find(
            (teamId) => typeof teamId === "string" && Boolean(teamId.trim()),
          );
          if (firstTeamId) {
            resolvedTeamId = firstTeamId;
          }
        }
      }
    }

    if (resolvedTeamId) {
      const teamDoc = await getDoc(doc(db, TEAMS_COLLECTION, resolvedTeamId));
      return {
        teamId: resolvedTeamId,
        team: teamDoc.exists()
          ? normalizeTeam(
              teamDoc.id,
              teamDoc.data() as Record<string, unknown>,
            )
          : null,
      };
    }

    const membershipQueries = [
      query(collection(db, TEAMS_COLLECTION), where("memberIds", "array-contains", user.uid), limit(1)),
      query(collection(db, TEAMS_COLLECTION), where("staffIds", "array-contains", user.uid), limit(1)),
      query(collection(db, TEAMS_COLLECTION), where("coachIds", "array-contains", user.uid), limit(1)),
    ];

    for (const membershipQuery of membershipQueries) {
      const snapshot = await getDocs(membershipQuery);
      if (!snapshot.empty) {
        const teamDoc = snapshot.docs[0];
        await setDoc(
          doc(db, USERS_COLLECTION, user.uid),
          {
            teamId: teamDoc.id,
            teamIds: arrayUnion(teamDoc.id),
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );

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
        setDoc(
          doc(db, USERS_COLLECTION, user.uid),
          {
            teamId: teamDoc.id,
            teamIds: arrayUnion(teamDoc.id),
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        ),
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

    await setDoc(
      doc(db, USERS_COLLECTION, user.uid),
      {
        teamId: createdTeamRef.id,
        teamIds: [createdTeamRef.id],
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

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

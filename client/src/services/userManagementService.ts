import { adminApiFetch } from "@/services/adminApi";

export const ROLES = {
  ADMIN: "admin",
  STATISTICIAN: "statistician",
  MANAGER: "manager",
  COACH: "coach",
  ATHLETE: "athlete",
  SPONSOR: "sponsor",
  MEDIA: "media",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
export type UserStatus = "active" | "inactive" | "suspended";

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  status: UserStatus;
  lastLogin: string | null;
  createdAt: string;
  emailVerified: boolean;
  photoURL?: string | null;
  phoneNumber?: string | null;
}

export interface CreateUserData {
  email: string;
  password?: string;
  name: string;
  role: UserRole | string;
  status?: UserStatus;
  phoneNumber?: string | null;
}

export type UpdateUserData = Partial<CreateUserData>;

const USERS_ENDPOINT = "/api/admin/users";

const normalizeUser = (user: Partial<ManagedUser> & { id: string }): ManagedUser => ({
  id: user.id,
  email: user.email || "",
  name: user.name || user.email || "User",
  role: user.role || ROLES.ATHLETE,
  status:
    user.status === "inactive" || user.status === "suspended"
      ? user.status
      : "active",
  lastLogin: user.lastLogin || null,
  createdAt: user.createdAt || new Date().toISOString(),
  emailVerified: Boolean(user.emailVerified),
  photoURL: user.photoURL || null,
  phoneNumber: user.phoneNumber || null,
});

const toPayload = (userData: UpdateUserData) => {
  const payload: Record<string, unknown> = {};

  if (typeof userData.email === "string") {
    payload.email = userData.email.trim();
  }

  if (typeof userData.name === "string") {
    payload.name = userData.name.trim();
  }

  if (typeof userData.password === "string" && userData.password.trim()) {
    payload.password = userData.password.trim();
  }

  if (typeof userData.role === "string" && userData.role.trim()) {
    payload.role = userData.role.trim();
  }

  if (typeof userData.status === "string") {
    payload.status = userData.status;
  }

  if (userData.phoneNumber !== undefined) {
    payload.phoneNumber =
      typeof userData.phoneNumber === "string" && userData.phoneNumber.trim()
        ? userData.phoneNumber.trim()
        : null;
  }

  return payload;
};

export async function getAllUsers(): Promise<ManagedUser[]> {
  const users = await adminApiFetch<ManagedUser[]>(USERS_ENDPOINT);
  return users.map(normalizeUser);
}

export async function createUser(userData: CreateUserData): Promise<ManagedUser> {
  const createdUser = await adminApiFetch<ManagedUser>(USERS_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      ...toPayload(userData),
      status: userData.status || "active",
    }),
  });

  return normalizeUser(createdUser);
}

export async function updateUser(
  userId: string,
  userData: UpdateUserData,
): Promise<ManagedUser> {
  const updatedUser = await adminApiFetch<ManagedUser>(
    `${USERS_ENDPOINT}/${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      body: JSON.stringify(toPayload(userData)),
    },
  );

  return normalizeUser(updatedUser);
}

export async function updateUserRole(
  userId: string,
  role: UserRole | string,
  userData: UpdateUserData = {},
): Promise<ManagedUser> {
  return updateUser(userId, { ...userData, role });
}

export async function deleteUser(
  userId: string,
  role?: UserRole | string,
): Promise<{
  success: boolean;
  userId: string;
  message: string;
}> {
  void role;

  return adminApiFetch<{ success: boolean; userId: string; message: string }>(
    `${USERS_ENDPOINT}/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
    },
  );
}

const userManagementService = {
  getAllUsers,
  createUser,
  updateUser,
  updateUserRole,
  deleteUser,
};

export { userManagementService };
export default userManagementService;

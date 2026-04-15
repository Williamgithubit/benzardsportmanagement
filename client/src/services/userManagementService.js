import { adminApiFetch } from "@/services/adminApi";

export const ROLES = {
  ADMIN: "admin",
  STATISTICIAN: "statistician",
  MANAGER: "manager",
  COACH: "coach",
  ATHLETE: "athlete",
  SPONSOR: "sponsor",
  MEDIA: "media",
};

const USERS_ENDPOINT = "/api/admin/users";

const normalizeUser = (user) => ({
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

const toPayload = (userData = {}) => {
  const payload = {};

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

  if (Object.prototype.hasOwnProperty.call(userData, "phoneNumber")) {
    payload.phoneNumber =
      typeof userData.phoneNumber === "string" && userData.phoneNumber.trim()
        ? userData.phoneNumber.trim()
        : null;
  }

  return payload;
};

export const getAllUsers = async () => {
  const users = await adminApiFetch(USERS_ENDPOINT);
  return users.map(normalizeUser);
};

export const createUser = async (userData) => {
  const createdUser = await adminApiFetch(USERS_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      ...toPayload(userData),
      status: userData?.status || "active",
    }),
  });

  return normalizeUser(createdUser);
};

export const updateUser = async (userId, userData) => {
  const updatedUser = await adminApiFetch(
    `${USERS_ENDPOINT}/${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      body: JSON.stringify(toPayload(userData)),
    },
  );

  return normalizeUser(updatedUser);
};

export const updateUserRole = async (userId, role, userData = {}) =>
  updateUser(userId, { ...userData, role });

export const deleteUser = async (userId, role) => {
  void role;

  return adminApiFetch(`${USERS_ENDPOINT}/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
};

const userManagementService = {
  getAllUsers,
  createUser,
  updateUser,
  updateUserRole,
  deleteUser,
};

export { userManagementService };
export default userManagementService;

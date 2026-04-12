"use client";
import React, { useState, useEffect } from "react";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdAdminPanelSettings,
  MdPerson,
  MdSportsSoccer,
  MdOutlineFitnessCenter,
  MdBusiness,
  MdCamera,
  MdRefresh,
  MdLockReset,
  MdSearch,
  MdClose,
  MdChevronLeft,
  MdChevronRight,
  MdQueryStats,
  MdEmail,
} from "react-icons/md";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { TableSkeleton } from "@/components/ui/Skeleton";

// Role types for sports management
type UserRole = "admin" | "manager" | "coach" | "athlete" | "sponsor" | "media" | "statistician";

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: "active" | "inactive" | "suspended";
  lastLogin: string | null;
  createdAt: string;
  emailVerified: boolean;
  photoURL?: string | null;
  phoneNumber?: string | null;
}

interface CreateUserData {
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  status?: "active" | "inactive" | "suspended";
  phoneNumber?: string | null;
}

interface UserManagementProps {
  openDialog?: boolean;
  onCloseDialog?: () => void;
}

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  coach: "Coach",
  athlete: "Athlete",
  sponsor: "Sponsor",
  media: "Media",
  statistician: "Statistician",
};

const roleIcons: Record<UserRole, React.ReactElement> = {
  admin: <MdAdminPanelSettings size={18} />,
  manager: <MdPerson size={18} />,
  coach: <MdSportsSoccer size={18} />,
  athlete: <MdOutlineFitnessCenter size={18} />,
  sponsor: <MdBusiness size={18} />,
  media: <MdCamera size={18} />,
  statistician: <MdQueryStats size={18} />,
};

const UserManagement: React.FC<UserManagementProps> = ({
  openDialog = false,
  onCloseDialog,
}) => {
  const auth = getAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch users with Firebase Authentication
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");
      const idToken = await currentUser.getIdToken(true);

      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const data: User[] = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (openDialog) {
      setDialogOpen(true);
      onCloseDialog?.();
    }
  }, [openDialog, onCloseDialog]);

  // Toast auto-hide
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleOpenDialog = (user: User | null = null) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingUser(null);
    setDialogOpen(false);
    setError(null);
    setSuccess(null);
  };

  const handleSaveUser = async (data: CreateUserData) => {
    setIsSubmitting(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");
      const idToken = await currentUser.getIdToken(true);

      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : "/api/admin/users";
      const method = editingUser ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error ||
            `Failed to ${editingUser ? "update" : "create"} user`,
        );
      }

      setSuccess(
        `${data.email} ${editingUser ? "updated" : "created"} successfully`,
      );
      await fetchUsers();
      handleCloseDialog();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${editingUser ? "update" : "create"} user`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    setIsLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");
      const idToken = await currentUser.getIdToken(true);

      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to delete user");
      }

      setSuccess("User deleted successfully");
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (user: User) => {
    if (!confirm(`Send password reset email to ${user.email}?`)) return;
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setSuccess(`Password reset email sent to ${user.email}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send password reset email",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const paginatedUsers = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "inactive":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "suspended":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="w-full mt-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-navy">
          User Management
        </h1>
        <button
          onClick={() => handleOpenDialog(null)}
          className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-hover text-white font-semibold py-2 px-4 rounded-md transition-colors shadow-sm"
        >
          <MdAdd size={20} />
          <span>Add User</span>
        </button>
      </div>

      {/* Toasts */}
      {success && (
        <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200 text-green-700 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>
            <MdClose />
          </button>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <MdClose />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
        {/* Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:w-auto sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <MdSearch size={20} />
            </span>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="pl-10 w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 text-slate-600 hover:text-navy hover:bg-slate-100 py-2 px-3 rounded text-sm font-medium transition-colors border border-slate-200 bg-white"
          >
            <MdRefresh size={18} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">User</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <TableSkeleton rows={6} columns={4} />
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.photoURL ? (
                          <img
                            src={u.photoURL}
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                            {roleIcons[u.role]}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">
                            {u.name}
                          </p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Joined {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                        {roleIcons[u.role]}
                        <span>{roleLabels[u.role]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(u.status)}`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 text-slate-500">
                        <button
                          onClick={() => handleOpenDialog(u)}
                          className="p-1.5 rounded hover:bg-slate-100 hover:text-navy transition-colors"
                          title="Edit User"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleResetPassword(u)}
                          className="p-1.5 rounded hover:bg-slate-100 hover:text-primary transition-colors"
                          title="Reset Password"
                        >
                          <MdLockReset size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete User"
                        >
                          <MdDelete size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-slate-500"
                  >
                    No users found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between text-sm bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(0);
                }}
                className="border-slate-300 rounded text-slate-700 bg-white py-1 px-2 focus:ring-primary focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-4 text-slate-600">
              <span>
                {page * rowsPerPage + 1}-
                {Math.min((page + 1) * rowsPerPage, filtered.length)} of{" "}
                {filtered.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <MdChevronLeft size={20} />
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <MdChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Dialog Alternative - Overlay Model */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <UserForm
              onClose={handleCloseDialog}
              onSave={handleSaveUser}
              user={editingUser}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface UserFormProps {
  onClose: () => void;
  onSave: (data: CreateUserData) => Promise<void>;
  user: User | null;
  isSubmitting: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  onClose,
  onSave,
  user,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState<CreateUserData>({
    email: user?.email || "",
    password: "",
    name: user?.name || "",
    role: user?.role || "athlete",
    status: user?.status || "active",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = "Name required";
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email))
      e.email = "Valid email required";
    if (!user && !formData.password) e.password = "Password required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    await onSave(formData);
  };

  return (
    <>
      <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-primary to-secondary">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {user ? "Edit User" : "Add New User"}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {user ? "Update user information and permissions" : "Create a new user account with role and permissions"}
          </p>
        </div>
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
        >
          <MdClose size={24} />
        </button>
      </div>

      <div className="p-6 overflow-y-auto bg-slate-50">
        <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MdPerson className="text-primary" size={18} />
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className={`w-full rounded-lg border ${errors.name ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-primary"} py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <span>⚠</span> {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MdEmail className="text-primary" size={18} />
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!!user}
              placeholder="admin@bsm.com"
              className={`w-full rounded-lg border ${errors.email ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-primary"} py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-all`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <span>⚠</span> {errors.email}
              </p>
            )}
          </div>

          {!user && (
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 block">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Secure password"
                className={`w-full rounded-md border ${errors.password ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-primary"} py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent`}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 block">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="coach">Coach</option>
                <option value="athlete">Athlete</option>
                <option value="sponsor">Sponsor</option>
                <option value="media">Media</option>
                <option value="statistician">Statistician</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 block">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-white">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-6 py-2.5 border-2 border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="user-form"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white font-bold rounded-lg flex items-center justify-center min-w-[140px] transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
          ) : user ? (
            "Update User"
          ) : (
            "Create User"
          )}
        </button>
      </div>
    </>
  );
};

export default UserManagement;

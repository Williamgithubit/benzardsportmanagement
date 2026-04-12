'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { FiUserPlus, FiTrash2, FiEdit2, FiUser, FiMail, FiLock, FiUserCheck } from 'react-icons/fi';
import { ROLES, createUser, getAllUsers, deleteUser } from '@/services/userManagementService';
import { selectCurrentUser } from '@/store/Auth/authSlice';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

const UsersPage = () => {
  const router = useRouter();
  const currentUser = useSelector(selectCurrentUser);
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: ROLES.ATHLETE,
    password: '',
    confirmPassword: ''
  });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const usersList = await getAllUsers();
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newUser.password !== newUser.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await createUser({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        password: newUser.password
      });
      
      toast.success('User created successfully');
      setNewUser({
        name: '',
        email: '',
        role: ROLES.ATHLETE,
        password: '',
        confirmPassword: ''
      });
      setIsAddingUser(false);
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      toast.error(errorMessage);
    }
  };

  const handleDeleteUser = async (userId: string, userRole: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      setIsDeleting(userId);
      await deleteUser(userId, userRole);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setIsDeleting(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleClasses: Record<string, string> = {
      [ROLES.ADMIN]: 'bg-purple-100 text-purple-800',
      [ROLES.MANAGER]: 'bg-sky-100 text-sky-800',
      [ROLES.COACH]: 'bg-blue-100 text-blue-800',
      [ROLES.ATHLETE]: 'bg-emerald-100 text-emerald-800',
      [ROLES.SPONSOR]: 'bg-amber-100 text-amber-800',
      [ROLES.MEDIA]: 'bg-rose-100 text-rose-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${roleClasses[role] || 'bg-gray-100 text-gray-800'}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#000054]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        {currentUser?.role === ROLES.ADMIN && (
          <button
            onClick={() => setIsAddingUser(!isAddingUser)}
            className="flex items-center px-4 py-2 bg-[#000054] text-white rounded-lg hover:bg-[#1a1a6e] transition-colors"
          >
            <FiUserPlus className="mr-2" />
            {isAddingUser ? 'Cancel' : 'Add New User'}
          </button>
        )}
      </div>

      {/* Add User Form */}
      {isAddingUser && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Add New User</h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newUser.name}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#000054] focus:ring-[#000054]"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#000054] focus:ring-[#000054]"
                    placeholder="user@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUserCheck className="text-gray-400" />
                  </div>
                  <select
                    id="role"
                    name="role"
                    value={newUser.role}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#000054] focus:ring-[#000054]"
                    required
                  >
                    <option value={ROLES.MANAGER}>Manager</option>
                    <option value={ROLES.COACH}>Coach</option>
                    <option value={ROLES.ATHLETE}>Athlete</option>
                    <option value={ROLES.SPONSOR}>Sponsor</option>
                    <option value={ROLES.MEDIA}>Media</option>
                    {currentUser?.role === ROLES.ADMIN && (
                      <option value={ROLES.ADMIN}>Administrator</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={newUser.password}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#000054] focus:ring-[#000054]"
                    placeholder="••••••••"
                    minLength={8}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={newUser.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#000054] focus:ring-[#000054]"
                    placeholder="••••••••"
                    minLength={8}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#000054] hover:bg-[#1a1a6e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#000054]"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <FiUser className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => router.push(`/dashboard/users/${user.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        {currentUser?.role === ROLES.ADMIN && user.id !== currentUser?.uid && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.role)}
                            className="text-red-600 hover:text-red-900"
                            disabled={isDeleting === user.id}
                          >
                            {isDeleting === user.id ? (
                              <div className="h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <FiTrash2 className="h-5 w-5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;

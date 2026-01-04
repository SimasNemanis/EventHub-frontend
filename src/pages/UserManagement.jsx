import React, { useState } from "react";
import { eventhub } from "@/api/eventhubClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Shield, Trash2, UserPlus, Search, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import ConfirmDialog from "../components/ConfirmDialog";

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "user"
  });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmRoleChange, setConfirmRoleChange] = useState(null);
  const [createError, setCreateError] = useState("");

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => eventhub.auth.me(),
  });

  const { data: usersResponse = {}, isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => eventhub.users.list(),
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Handle both array and object responses from the API
  const users = Array.isArray(usersResponse) ? usersResponse : (usersResponse.data || []);

  const createUserMutation = useMutation({
    mutationFn: async (userData) => {
      return await eventhub.auth.register(userData.full_name, userData.email, userData.password);
    },
    onSuccess: async (data) => {
      // After user is created, update their role if needed
      if (createFormData.role === 'admin' && data.user?.id) {
        await eventhub.users.update(data.user.id, { role: 'admin' });
      }
      queryClient.invalidateQueries(['allUsers']);
      setShowCreateForm(false);
      setCreateFormData({ full_name: "", email: "", password: "", role: "user" });
      setCreateError("");
    },
    onError: (error) => {
      setCreateError(error.message || "Failed to create user");
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }) => {
      await eventhub.users.update(userId, { role: newRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allUsers']);
      setConfirmRoleChange(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      await eventhub.users.delete(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allUsers']);
      setConfirmDelete(null);
    },
  });

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!createFormData.full_name || !createFormData.email || !createFormData.password) {
      setCreateError("All fields are required");
      return;
    }
    setCreateError("");
    createUserMutation.mutate(createFormData);
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const adminUsers = filteredUsers.filter(u => u.role === 'admin');
  const regularUsers = filteredUsers.filter(u => u.role === 'user');

  // Extract user data from API response wrapper
  const userData = currentUser?.data || currentUser;
  if (userData?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8" style={{ color: 'var(--md-accent)' }} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage users, roles, and access</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-3 rounded-lg text-white font-medium ripple material-button flex items-center gap-2"
            style={{ backgroundColor: 'var(--md-accent)' }}
          >
            <UserPlus className="w-5 h-5" />
            Create User
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 elevation-2 mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-900 dark:text-red-200">{createError}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={createFormData.full_name}
                  onChange={(e) => setCreateFormData({ ...createFormData, full_name: e.target.value })}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="password"
                  placeholder="Password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  required
                />
                <Select value={createFormData.role} onValueChange={(value) => setCreateFormData({ ...createFormData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateFormData({ full_name: "", email: "", password: "", role: "user" });
                    setCreateError("");
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="flex-1 px-4 py-2 rounded-lg text-white font-medium ripple material-button"
                  style={{ backgroundColor: 'var(--md-primary)' }}
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 elevation-1 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 elevation-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--md-primary)', opacity: 0.1 }}>
                <Users className="w-6 h-6" style={{ color: 'var(--md-primary)' }} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 elevation-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{adminUsers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 elevation-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Regular Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{regularUsers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg h-24 elevation-1 animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 elevation-1 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Admins Section */}
            {adminUsers.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-purple-600" />
                  Administrators
                </h2>
                <div className="space-y-3">
                  {adminUsers.map((user) => (
                    <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 elevation-1 hover-elevation-2 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: 'var(--md-accent)' }}>
                            {user.full_name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900 dark:text-white">{user.full_name || 'No Name'}</h3>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Admin
                              </span>
                              {user.id === userData?.id && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {user.id !== userData?.id && (
                            <>
                              <Select
                                value={user.role}
                                onValueChange={(newRole) => setConfirmRoleChange({ user, newRole })}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <button
                                onClick={() => setConfirmDelete(user)}
                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Users Section */}
            {regularUsers.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Regular Users
                </h2>
                <div className="space-y-3">
                  {regularUsers.map((user) => (
                    <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 elevation-1 hover-elevation-2 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: 'var(--md-primary)' }}>
                            {user.full_name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900 dark:text-white">{user.full_name || 'No Name'}</h3>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                User
                              </span>
                              {user.id === userData?.id && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {user.id !== userData?.id && (
                            <>
                              <Select
                                value={user.role}
                                onValueChange={(newRole) => setConfirmRoleChange({ user, newRole })}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <button
                                onClick={() => setConfirmDelete(user)}
                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confirm Dialogs */}
        {confirmDelete && (
          <ConfirmDialog
            title="Delete User"
            message={`Are you sure you want to delete ${confirmDelete.full_name}? This action cannot be undone.`}
            onConfirm={() => deleteUserMutation.mutate(confirmDelete.id)}
            onCancel={() => setConfirmDelete(null)}
            isLoading={deleteUserMutation.isPending}
            isDangerous
          />
        )}

        {confirmRoleChange && (
          <ConfirmDialog
            title="Change User Role"
            message={`Change ${confirmRoleChange.user.full_name}'s role to ${confirmRoleChange.newRole}?`}
            onConfirm={() => changeRoleMutation.mutate({ userId: confirmRoleChange.user.id, newRole: confirmRoleChange.newRole })}
            onCancel={() => setConfirmRoleChange(null)}
            isLoading={changeRoleMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

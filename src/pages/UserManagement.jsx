import React, { useState } from "react";
import { eventhub } from "@/api/eventhubClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Mail, Shield, Trash2, UserPlus, Search, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import ConfirmDialog from "../components/ConfirmDialog";

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmRoleChange, setConfirmRoleChange] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => eventhub.auth.me(),
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => eventhub.users.list(),
  });

  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      await eventhub.users.inviteUser(email, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allUsers']);
      setShowInviteForm(false);
      setInviteEmail("");
      setInviteRole("user");
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }) => {
      await eventhub.users.changeRole(userId, newRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allUsers']);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      await eventhub.users.delete(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allUsers']);
    },
  });

  const handleInvite = (e) => {
    e.preventDefault();
    if (inviteEmail) {
      inviteUserMutation.mutate({ email: inviteEmail, role: inviteRole });
    }
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
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="px-4 py-3 rounded-lg text-white font-medium ripple material-button flex items-center gap-2"
            style={{ backgroundColor: 'var(--md-accent)' }}
          >
            <UserPlus className="w-5 h-5" />
            Invite User
          </button>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 elevation-2 mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create New User</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="flex gap-4">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  type="submit"
                  disabled={inviteUserMutation.isPending}
                  className="px-6 py-2 rounded-lg text-white font-medium ripple material-button whitespace-nowrap"
                  style={{ backgroundColor: 'var(--md-primary)' }}
                >
                  {inviteUserMutation.isPending ? 'Creating...' : 'Create User'}
                </button>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-900 dark:text-blue-200">
                  <strong>📧 How it works:</strong> An invitation email will be sent to the user with a link to set their password and complete registration. 
                  {inviteRole === 'admin' && ' This user will have admin privileges once they complete registration.'}
                </p>
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
                              {user.id === currentUser.id && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Joined {format(new Date(user.created_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => setConfirmRoleChange({ user, newRole })}
                            disabled={user.id === currentUser.id}
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
                            disabled={user.id === currentUser.id}
                            className={`p-2 rounded-lg transition-colors ${
                              user.id === currentUser.id
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                            title={user.id === currentUser.id ? "You cannot delete yourself" : "Delete user"}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
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
                          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-white font-bold text-lg">
                            {user.full_name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900 dark:text-white">{user.full_name || 'No Name'}</h3>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                User
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Joined {format(new Date(user.created_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
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
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredUsers.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-12 elevation-1 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No users found</h3>
                <p className="text-gray-600 dark:text-gray-400">Try adjusting your search</p>
              </div>
            )}
          </div>
        )}

        <ConfirmDialog
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => {
            deleteUserMutation.mutate(confirmDelete.id);
            setConfirmDelete(null);
          }}
          title="Delete User"
          message={`Are you sure you want to delete ${confirmDelete?.full_name}? This will permanently remove their account and all associated data.`}
          confirmText="Delete User"
          confirmColor="red"
        />

        <ConfirmDialog
          isOpen={!!confirmRoleChange}
          onClose={() => setConfirmRoleChange(null)}
          onConfirm={() => {
            changeRoleMutation.mutate({ 
              userId: confirmRoleChange.user.id, 
              newRole: confirmRoleChange.newRole 
            });
            setConfirmRoleChange(null);
          }}
          title="Change User Role"
          message={`Are you sure you want to change ${confirmRoleChange?.user?.full_name}'s role to ${confirmRoleChange?.newRole}?`}
          confirmText="Change Role"
          confirmColor="blue"
        />
      </div>
    </div>
  );
}
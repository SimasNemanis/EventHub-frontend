import React, { useState } from "react";
import { eventhub } from "@/api/eventhubClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Save, Mail, Phone, Building, FileText, Bell, Calendar, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

export default function Profile() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => eventhub.auth.me(),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['myBookings', user?.email],
    queryFn: () => eventhub.entities.Booking.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    bio: user?.bio || '',
    notification_preferences: user?.notification_preferences || {
      email_reminders: true,
      booking_confirmations: true,
      weekly_digest: true
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => eventhub.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
    },
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await eventhub.integrations.Core.UploadFile({ file });
      await eventhub.auth.updateMe({ avatar_url: file_url });
      queryClient.invalidateQueries(['currentUser']);
    } catch (error) {
      console.error("Upload error:", error);
    }
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  React.useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        department: user.department || '',
        bio: user.bio || '',
        notification_preferences: user.notification_preferences || {
          email_reminders: true,
          booking_confirmations: true,
          weekly_digest: true
        }
      });
    }
  }, [user]);

  const stats = {
    totalBookings: bookings.length,
    activeBookings: bookings.filter(b => b.status === 'confirmed').length,
    eventBookings: bookings.filter(b => b.booking_type === 'event').length,
    resourceBookings: bookings.filter(b => b.booking_type === 'resource').length,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF9' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg elevation-1 p-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 rounded-full mx-auto overflow-hidden" style={{ backgroundColor: 'var(--md-accent)' }}>
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                      {user?.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 rounded-full bg-white elevation-2 cursor-pointer hover-elevation-3">
                  <Camera className="w-5 h-5" style={{ color: 'var(--md-primary)' }} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-1">{user?.full_name}</h2>
              <p className="text-gray-600 mb-4">{user?.email}</p>
              <span className="inline-block px-4 py-2 rounded-full text-sm font-medium text-white" style={{ backgroundColor: 'var(--md-primary)' }}>
                {user?.role === 'admin' ? 'Administrator' : 'Member'}
              </span>

              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                    <p className="text-sm text-gray-600">Total Bookings</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeBookings}</p>
                    <p className="text-sm text-gray-600">Active</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.eventBookings}</p>
                    <p className="text-sm text-gray-600">Events</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.resourceBookings}</p>
                    <p className="text-sm text-gray-600">Resources</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg elevation-1 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="full_name" className="text-sm font-medium text-gray-700 mb-2 block">
                    Full Name / Username
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Enter your full name or username"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      value={user?.email}
                      disabled
                      className="pl-10 bg-gray-50"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900 font-medium mb-1">🔐 Password Management</p>
                  <p className="text-xs text-blue-700">
                    To change your password, please log out and use the "Forgot Password" option on the login page for secure password reset via email.
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Enter your phone number"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="department" className="text-sm font-medium text-gray-700 mb-2 block">
                    Department
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      placeholder="Enter your department"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio" className="text-sm font-medium text-gray-700 mb-2 block">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    className="h-24"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="w-full py-3 rounded-lg text-white font-medium ripple material-button flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--md-primary)' }}
                >
                  <Save className="w-5 h-5" />
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-lg elevation-1 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="w-5 h-5" style={{ color: 'var(--md-primary)' }} />
                <h3 className="text-xl font-bold text-gray-900">Notification Preferences</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">Email Reminders</p>
                    <p className="text-sm text-gray-600">Receive reminders about upcoming events</p>
                  </div>
                  <Switch
                    checked={formData.notification_preferences.email_reminders}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notification_preferences: {
                        ...formData.notification_preferences,
                        email_reminders: checked
                      }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">Booking Confirmations</p>
                    <p className="text-sm text-gray-600">Get notified when bookings are confirmed</p>
                  </div>
                  <Switch
                    checked={formData.notification_preferences.booking_confirmations}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notification_preferences: {
                        ...formData.notification_preferences,
                        booking_confirmations: checked
                      }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">Weekly Digest</p>
                    <p className="text-sm text-gray-600">Receive weekly summary of activities</p>
                  </div>
                  <Switch
                    checked={formData.notification_preferences.weekly_digest}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notification_preferences: {
                        ...formData.notification_preferences,
                        weekly_digest: checked
                      }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
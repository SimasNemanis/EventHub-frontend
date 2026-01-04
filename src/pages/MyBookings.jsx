import { useState } from "react";
import { eventhub } from "@/api/eventhubClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, Package, XCircle } from "lucide-react";
import { format } from "date-fns";
import ConfirmDialog from "../components/ConfirmDialog";

export default function MyBookings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [confirmCancel, setConfirmCancel] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => eventhub.auth.me(),
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: async () => {
      const response = await eventhub.bookings.list();
      return Array.isArray(response) ? response : (response?.data || []);
    },
    enabled: !!user,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await eventhub.events.list();
      return Array.isArray(response) ? response : (response?.data || []);
    },
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const response = await eventhub.resources.list();
      return Array.isArray(response) ? response : (response?.data || []);
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (booking) => {
      // Check if booking is within 24 hours (but not in the past)
      const bookingDate = new Date(booking.start_date);
      const now = new Date();
      const hoursDiff = (bookingDate - now) / (1000 * 60 * 60);
      
      // Only prevent cancellation if booking is upcoming and within 24 hours
      if (hoursDiff > 0 && hoursDiff < 24) {
        throw new Error('Cannot cancel bookings within 24 hours of start time');
      }

      // Cancel the booking first
      await eventhub.bookings.update(booking.id, { status: 'cancelled' });
      
      // Try to update event registered count, but don't fail if it errors
      if (booking.booking_type === 'event') {
        try {
          const event = events.find(e => e.id === booking.event_id);
          if (event) {
            await eventhub.events.update(event.id, {
              registered_count: Math.max(0, (event.registered_count || 0) - 1)
            });
          }
        } catch (error) {
          console.warn('Could not update event registered count:', error);
          // Don't throw - cancellation was successful even if count update failed
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myBookings']);
      queryClient.invalidateQueries(['events']);
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const getEventDetails = (eventId) => events.find(e => e.id === eventId);
  const getResourceDetails = (resourceId) => resources.find(r => r.id === resourceId);

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === "all") return true;
    return booking.booking_type === activeTab;
  });

  // Separate bookings into active (upcoming/current), past, and cancelled
  const now = new Date();
  const confirmedBookings = filteredBookings.filter(b => b.status === 'confirmed');
  
  const activeBookings = confirmedBookings.filter(b => {
    const endDate = new Date(b.end_date);
    return endDate >= now; // Booking hasn't ended yet
  });
  
  const pastBookings = confirmedBookings.filter(b => {
    const endDate = new Date(b.end_date);
    return endDate < now; // Booking has ended
  });
  
  const cancelledBookings = filteredBookings.filter(b => b.status === 'cancelled');

  const canCancel = (booking) => {
    const bookingDate = new Date(booking.start_date);
    const now = new Date();
    const hoursDiff = (bookingDate - now) / (1000 * 60 * 60);
    
    // Allow cancellation if:
    // 1. Booking is in the past (for cleanup)
    // 2. Booking is more than 24 hours in the future
    return hoursDiff < 0 || hoursDiff >= 24;
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      return format(new Date(dateString), 'h:mm a');
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF9' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">Manage your event registrations and resource bookings</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg elevation-1 mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { id: "all", label: "All Bookings" },
              { id: "event", label: "Event Registrations" },
              { id: "resource", label: "Resource Bookings" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        ) : activeBookings.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-6">Start by registering for an event or booking a resource</p>
            <div className="flex gap-4 justify-center">
              <a href="/events" className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                Browse Events
              </a>
              <a href="/resources" className="px-6 py-2 rounded-lg border border-green-600 text-green-600 hover:bg-green-50">
                View Resources
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeBookings.map((booking) => {
              const isEvent = booking.booking_type === 'event';
              const eventDetails = isEvent ? getEventDetails(booking.event_id) : null;
              const resourceDetails = !isEvent ? getResourceDetails(booking.resource_id) : null;
              const itemName = booking.event_title || booking.resource_name || eventDetails?.title || resourceDetails?.name || 'Unknown';
              const itemLocation = eventDetails?.location || resourceDetails?.location || '';

              return (
                <div key={booking.id} className="bg-white rounded-lg p-6 elevation-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{itemName}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                        isEvent ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isEvent ? 'Event Registration' : 'Resource Booking'}
                      </span>
                    </div>
                    {canCancel(booking) && (
                      <button
                        onClick={() => setConfirmCancel(booking)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <XCircle className="w-5 h-5 text-red-500" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(booking.start_date)}</span>
                    </div>
                    {booking.start_date && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(booking.start_date)} - {formatTime(booking.end_date)}</span>
                      </div>
                    )}
                    {itemLocation && (
                      <div className="flex items-center gap-2 col-span-2">
                        <MapPin className="w-4 h-4" />
                        <span>{itemLocation}</span>
                      </div>
                    )}
                  </div>

                  {booking.total_price && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-lg font-bold text-gray-900">
                        Total: ${parseFloat(booking.total_price).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Past Bookings (History) */}
        {pastBookings.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">History</h2>
            <div className="space-y-4">
              {pastBookings.map((booking) => {
                const isEvent = booking.booking_type === 'event';
                const eventDetails = isEvent ? getEventDetails(booking.event_id) : null;
                const resourceDetails = !isEvent ? getResourceDetails(booking.resource_id) : null;
                const itemName = booking.event_title || booking.resource_name || eventDetails?.title || resourceDetails?.name || 'Unknown';
                const itemLocation = eventDetails?.location || resourceDetails?.location || '';

                return (
                  <div key={booking.id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-700">{itemName}</h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                          isEvent ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {isEvent ? 'Event Registration' : 'Resource Booking'}
                        </span>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ml-2 bg-gray-200 text-gray-600">
                          Completed
                        </span>
                      </div>
                      <button
                        onClick={() => setConfirmCancel(booking)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete from history"
                      >
                        <XCircle className="w-5 h-5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(booking.start_date)}</span>
                      </div>
                      {booking.start_date && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(booking.start_date)} - {formatTime(booking.end_date)}</span>
                        </div>
                      )}
                      {itemLocation && (
                        <div className="flex items-center gap-2 col-span-2">
                          <MapPin className="w-4 h-4" />
                          <span>{itemLocation}</span>
                        </div>
                      )}
                    </div>

                    {booking.total_price && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-lg font-bold text-gray-700">
                          Total: ${parseFloat(booking.total_price).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cancelled Bookings */}
        {cancelledBookings.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Cancelled Bookings</h2>
            <div className="space-y-4">
              {cancelledBookings.map((booking) => {
                const isEvent = booking.booking_type === 'event';
                // Use the joined fields from the backend instead of looking up again
                const itemName = booking.event_title || booking.resource_name || 'Unknown';

                return (
                  <div key={booking.id} className="bg-gray-50 rounded-lg p-6 opacity-60">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-5 h-5 text-gray-400" />
                      <div>
                        <h3 className="font-bold text-gray-900">{itemName}</h3>
                        <p className="text-sm text-gray-600">{formatDate(booking.start_date)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      {confirmCancel && (
        <ConfirmDialog
          title="Cancel Booking"
          message={`Are you sure you want to cancel this booking? This action cannot be undone.`}
          confirmText="Cancel Booking"
          cancelText="Keep Booking"
          onConfirm={() => {
            cancelBookingMutation.mutate(confirmCancel);
            setConfirmCancel(null);
          }}
          onCancel={() => setConfirmCancel(null)}
          isDangerous
        />
      )}
    </div>
  );
}

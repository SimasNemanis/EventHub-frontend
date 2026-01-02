import React, { useState } from "react";
import { eventhub } from "@/api/eventhubClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Calendar, Package, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

export default function BookingApprovals() {
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingBookingId, setRejectingBookingId] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => eventhub.auth.me(),
  });

  const { data: pendingBookings = [], isLoading } = useQuery({
    queryKey: ['pendingBookings'],
    queryFn: () => eventhub.entities.Booking.filter({ status: 'pending', approval_required: true }),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventhub.entities.Event.list(),
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => eventhub.entities.Resource.list(),
  });

  const approveMutation = useMutation({
    mutationFn: async (booking) => {
      await eventhub.entities.Booking.update(booking.id, {
        status: 'confirmed',
        approved_by: user.email,
        approval_date: new Date().toISOString(),
      });

      // Send approval email
      const bookingUser = await eventhub.asServiceRole.entities.User.filter({ email: booking.created_by });
      if (bookingUser.length > 0) {
        await eventhub.integrations.Core.SendEmail({
          to: booking.created_by,
          subject: 'Booking Approved',
          body: `Your booking for ${booking.date} at ${booking.start_time} has been approved.`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingBookings']);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ booking, reason }) => {
      await eventhub.entities.Booking.update(booking.id, {
        status: 'rejected',
        approved_by: user.email,
        approval_date: new Date().toISOString(),
        rejection_reason: reason,
      });

      // Send rejection email
      const bookingUser = await eventhub.asServiceRole.entities.User.filter({ email: booking.created_by });
      if (bookingUser.length > 0) {
        await eventhub.integrations.Core.SendEmail({
          to: booking.created_by,
          subject: 'Booking Rejected',
          body: `Your booking for ${booking.date} at ${booking.start_time} has been rejected.\n\nReason: ${reason}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingBookings']);
      setRejectingBookingId(null);
      setRejectionReason("");
    },
  });

  const getItemDetails = (booking) => {
    if (booking.booking_type === 'event') {
      return events.find(e => e.id === booking.event_id);
    } else {
      return resources.find(r => r.id === booking.resource_id);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Booking Approvals</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and approve pending bookings</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg h-48 elevation-1 animate-pulse" />
            ))}
          </div>
        ) : pendingBookings.length > 0 ? (
          <div className="space-y-4">
            {pendingBookings.map((booking) => {
              const details = getItemDetails(booking);
              const isEvent = booking.booking_type === 'event';

              return (
                <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 elevation-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isEvent ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {isEvent ? (
                          <Calendar className="w-6 h-6 text-blue-600" />
                        ) : (
                          <Package className="w-6 h-6 text-green-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                          {isEvent ? details?.title : details?.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <User className="w-4 h-4" />
                          <span>{booking.created_by}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending Approval
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(booking.date), "MMMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{booking.start_time} - {booking.end_time}</span>
                    </div>
                  </div>

                  {booking.purpose && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      <span className="font-medium">Purpose:</span> {booking.purpose}
                    </p>
                  )}

                  {rejectingBookingId === booking.id ? (
                    <div className="space-y-3">
                      <Input
                        placeholder="Reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setRejectingBookingId(null);
                            setRejectionReason("");
                          }}
                          className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate({ booking, reason: rejectionReason })}
                          disabled={!rejectionReason}
                          className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => approveMutation.mutate(booking)}
                        className="flex-1 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectingBookingId(booking.id)}
                        className="flex-1 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 elevation-1 text-center">
            <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">All caught up!</h3>
            <p className="text-gray-600 dark:text-gray-400">No pending bookings to review</p>
          </div>
        )}
      </div>
    </div>
  );
}
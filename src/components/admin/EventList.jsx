import React, { useState } from "react";
import { Edit, Trash2, Calendar, Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import ConfirmDialog from "../ConfirmDialog";

export default function EventList({ events, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No events yet. Create your first event!</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      return format(new Date(dateString), 'HH:mm');
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium mt-1" style={{ backgroundColor: 'var(--md-primary)', color: 'white' }}>
                {event.status || 'Draft'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(event)}
                className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Edit className="w-5 h-5 text-blue-600" />
              </button>
              <button
                onClick={() => setConfirmDelete(event)}
                className="p-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>

          <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(event.start_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{formatTime(event.start_date)} - {formatTime(event.end_date)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{event.registered_count || 0} / {event.capacity || 'N/A'}</span>
            </div>
          </div>

          {event.ticket_price && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-900">
                Price: ${parseFloat(event.ticket_price).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      ))}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          onDelete(confirmDelete.id);
          setConfirmDelete(null);
        }}
        title="Delete Event"
        message={`Are you sure you want to delete "${confirmDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Event"
        confirmColor="red"
      />
    </div>
  );
}

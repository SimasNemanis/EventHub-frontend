import React from "react";
import { Calendar, Clock, MapPin, Users, Star } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { eventhub } from "@/api/eventhubClient";

const categoryColors = {
  workshop: "bg-purple-500",
  seminar: "bg-blue-500",
  conference: "bg-indigo-500",
  training: "bg-green-500",
  meeting: "bg-orange-500",
  social: "bg-pink-500",
  other: "bg-gray-500"
};

export default function EventCard({ event, onRegister, isRegistered, onJoinWaitlist, onAddToCart }) {
  const spotsLeft = event.capacity - (event.registered_count || 0);
  const spotsPercentage = ((event.registered_count || 0) / event.capacity) * 100;
  const isFull = spotsLeft === 0;

  const getEventStatus = () => {
    const today = new Date().toISOString().split('T')[0];
    const eventDate = event.date;
    
    if (eventDate < today) return { label: 'Past Event', color: 'bg-gray-500' };
    if (eventDate === today) return { label: 'Today', color: 'bg-red-500' };
    
    const daysUntil = Math.ceil((new Date(eventDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 7) return { label: 'This Week', color: 'bg-orange-500' };
    
    return null;
  };

  const statusBadge = getEventStatus();

  const { data: ratings = [] } = useQuery({
    queryKey: ['eventRatings', event.id],
    queryFn: () => eventhub.entities.Rating.filter({ event_id: event.id }),
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => eventhub.entities.Resource.list(),
  });

  const averageRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : null;

  const assignedResourceIds = event.assigned_resource_ids || [];
  const assignedResources = resources.filter(r => 
    assignedResourceIds.includes(r.id)
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden elevation-1 hover-elevation-3 transition-all duration-300">
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.image_url || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80`}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${categoryColors[event.category] || categoryColors.other}`}>
            {event.category}
          </div>
          {statusBadge && (
            <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${statusBadge.color}`}>
              {statusBadge.label}
            </div>
          )}
        </div>
        {isRegistered && (
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-green-500 text-white text-sm font-medium">
            Registered
          </div>
        )}
        {averageRating && (
          <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black bg-opacity-60 text-white text-sm font-medium flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            {averageRating}
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{event.title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
            <Calendar className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />
            <span>{format(new Date(event.date), "MMMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
            <Clock className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />
            <span>{event.start_time} - {event.end_time}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
              <MapPin className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {/* Assigned Resources */}
        {assignedResources.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Resources:</p>
            <div className="flex flex-wrap gap-2">
              {assignedResources.map(resource => (
                <span
                  key={resource.id}
                  className="px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                >
                  {resource.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Users className="w-4 h-4" />
              <span className="font-medium">{event.registered_count || 0} / {event.capacity}</span>
            </div>
            <span className="text-sm font-medium" style={{ color: spotsLeft < 10 ? 'var(--md-accent)' : 'var(--md-primary)' }}>
              {isFull ? 'Full' : `${spotsLeft} spots left`}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${spotsPercentage}%`,
                backgroundColor: spotsPercentage > 90 ? 'var(--md-accent)' : 'var(--md-primary)'
              }}
            />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {event.ticket_price > 0 ? 'Ticket Price' : 'Free Event'}
          </span>
          <span className="text-2xl font-bold" style={{ color: 'var(--md-primary)' }}>
            {event.ticket_price > 0 ? `$${event.ticket_price}` : 'FREE'}
          </span>
        </div>

        <button
          onClick={() => {
            if (isFull && !isRegistered) {
              onJoinWaitlist(event);
            } else if (event.ticket_price > 0 && !isRegistered) {
              onAddToCart(event);
            } else if (!isRegistered) {
              onRegister(event);
            }
          }}
          disabled={isRegistered}
          className={`w-full py-3 rounded-lg font-medium text-white ripple material-button ${
            isRegistered ? 'bg-gray-400 cursor-not-allowed' : ''
          }`}
          style={!isRegistered ? { backgroundColor: isFull ? 'var(--md-accent)' : 'var(--md-primary)' } : {}}
        >
          {isRegistered ? 'Already Registered' : isFull ? 'Join Waiting List' : event.ticket_price > 0 ? 'Add to Cart' : 'Register Free'}
        </button>
      </div>
    </div>
  );
}
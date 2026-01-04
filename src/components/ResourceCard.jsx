import React from "react";
import { MapPin, Users, CheckCircle } from "lucide-react";

const typeIcons = {
  room: "🏢",
  equipment: "⚙️",
  vehicle: "🚗",
  facility: "🏛️",
  technology: "💻",
  other: "📦"
};

const typeColors = {
  room: "bg-blue-500",
  equipment: "bg-green-500",
  vehicle: "bg-orange-500",
  facility: "bg-purple-500",
  technology: "bg-indigo-500",
  other: "bg-gray-500"
};

export default function ResourceCard({ resource, onBook, onAddToCart, onBookNow }) {
  // Determine if resource is available
  const isAvailable = resource.availability_status === 'available';
  
  // Get resource type from category or default to 'other'
  const resourceType = (resource.category || 'other').toLowerCase();
  
  return (
    <div className="bg-white rounded-lg overflow-hidden elevation-1 hover-elevation-3 transition-all duration-300">
      {/* Resource Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={resource.image_url || `https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80`}
          alt={resource.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        <div className={`absolute top-4 left-4 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${typeColors[resourceType] || typeColors.other}`}>
          {typeIcons[resourceType] || typeIcons.other}
        </div>
        {isAvailable && (
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-green-500 text-white text-sm font-medium flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Available
          </div>
        )}
      </div>

      {/* Resource Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">{resource.name}</h3>
          <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: 'var(--md-primary)' }}>
            {resource.category || 'Other'}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{resource.description}</p>

        {/* Resource Details */}
        <div className="space-y-2 mb-4">
          {resource.location && (
            <div className="flex items-center gap-2 text-gray-700 text-sm">
              <MapPin className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />
              <span>{resource.location}</span>
            </div>
          )}
          {resource.capacity && (
            <div className="flex items-center gap-2 text-gray-700 text-sm">
              <Users className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />
              <span>Capacity: {resource.capacity} people</span>
            </div>
          )}
        </div>

        {/* Features */}
        {resource.features && resource.features.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {resource.features.slice(0, 3).map((feature, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {feature}
                </span>
              ))}
              {resource.features.length > 3 && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  +{resource.features.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Price per day</span>
            <span className="text-2xl font-bold" style={{ color: 'var(--md-primary)' }}>
              ${resource.daily_price || 0}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            if (resource.daily_price > 0) {
              onAddToCart(resource);
            } else if (onBookNow) {
              onBookNow(resource);
            } else {
              onAddToCart(resource);
            }
          }}
          disabled={!isAvailable}
          className={`w-full py-3 rounded-lg font-medium text-white ripple material-button ${
            !isAvailable ? 'bg-gray-400 cursor-not-allowed' : ''
          }`}
          style={isAvailable ? { backgroundColor: 'var(--md-primary)' } : {}}
        >
          {!isAvailable ? 'Not Available' : resource.daily_price > 0 ? 'Add to Cart' : 'Book Now'}
        </button>
      </div>
    </div>
  );
}

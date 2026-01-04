import React, { useState } from "react";
import { eventhub } from "@/api/eventhubClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import ResourceCard from "../components/ResourceCard";
import BookingDialog from "../components/BookingDialog";

export default function Resources() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedResource, setSelectedResource] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => eventhub.auth.me(),
  });

  const { data: resourcesData = [], isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const response = await eventhub.resources.list();
      console.log('Resources API Response:', response);
      const data = response.data || response || [];
      console.log('Extracted resources data:', data);
      return data;
    },
  });
  
  const resources = Array.isArray(resourcesData) ? resourcesData : [];

  const { data: allBookings = [] } = useQuery({
    queryKey: ['allBookings'],
    queryFn: () => eventhub.bookings.list().then(r => {
      const bookings = Array.isArray(r) ? r : (r?.data || []);
      return bookings.filter(b => b.booking_type === 'resource');
    }),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventhub.events.list().then(r => Array.isArray(r) ? r : (r?.data || [])),
  });

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || resource.category === typeFilter;
    return matchesSearch && matchesType;
  });

  console.log('Resources state:', resources);
  console.log('Filtered resources:', filteredResources);

  const addToCart = (resource, formData) => {
    // Check if already in cart with same date/time
    const savedCart = localStorage.getItem('cart');
    const currentCart = savedCart ? JSON.parse(savedCart) : [];
    
    const alreadyInCart = currentCart.some(item => 
      item.type === 'resource' && 
      item.itemId === resource.id &&
      item.startDate === formData.date &&
      item.startTime === formData.start_time &&
      item.endTime === formData.end_time
    );
    
    if (alreadyInCart) {
      alert('This resource booking is already in your cart!');
      setSelectedResource(null);
      return;
    }
    
    // Check if already booked for this time
    const hasConflict = allBookings.some(booking => {
      if (booking.resource_id !== resource.id || booking.status !== 'confirmed') return false;
      
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);
      const newStart = new Date(`${formData.date}T${formData.start_time}:00`);
      const newEnd = new Date(`${formData.date}T${formData.end_time}:00`);
      
      return (newStart < bookingEnd && newEnd > bookingStart);
    });
    
    if (hasConflict) {
      alert(`You already have a booking for "${resource.name}" at this time!`);
      setSelectedResource(null);
      return;
    }
    
    const totalPrice = resource.daily_price || 0;

    const cartItem = {
      type: 'resource',
      id: resource.id,
      itemId: resource.id,
      name: resource.name,
      image: resource.image_url,
      pricePerDay: resource.daily_price || 0,
      totalPrice: totalPrice,
      startDate: formData.date,
      startTime: formData.start_time,
      endTime: formData.end_time,
      purpose: formData.purpose,
      notes: formData.notes
    };

    currentCart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(currentCart));
    window.dispatchEvent(new Event('cartUpdated'));
    
    setSelectedResource(null);
  };

  const types = ["all", "Room", "Equipment", "Vehicle", "Facility", "Technology", "Other"];

  const getResourceBookings = (resourceId) => {
    return allBookings.filter(b => b.resource_id === resourceId && b.status === 'confirmed');
  };

  const getResourceEventAssignments = (resourceId) => {
    return events.filter(e => {
      const resourceIds = e.assigned_resource_ids || [];
      return Array.isArray(resourceIds) && resourceIds.includes(resourceId);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{ backgroundColor: '#FAFAF9' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Resources</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse and book available resources</p>
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 elevation-1 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div className="flex gap-2">
                {types.map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all material-button ${
                      typeFilter === type
                        ? 'text-white bg-blue-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg h-96 elevation-1 animate-pulse" />
            ))}
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="space-y-6">
            {/* Resource Usage Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                💡 Resources can be assigned to events. Check event assignments to see when resources are in use.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => {
                const eventAssignments = getResourceEventAssignments(resource.id);
                
                return (
                  <div key={resource.id} className="relative">
                    <ResourceCard
                      resource={resource}
                      onAddToCart={(resource) => setSelectedResource(resource)}
                    />
                    {eventAssignments.length > 0 && (
                      <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg elevation-1 text-xs">
                        <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          📅 Assigned to {eventAssignments.length} event(s)
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {eventAssignments.slice(0, 2).map(e => e.title).join(', ')}
                          {eventAssignments.length > 2 && ` +${eventAssignments.length - 2} more`}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 elevation-1 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--md-primary)', opacity: 0.1 }}>
                <Search className="w-10 h-10" style={{ color: 'var(--md-primary)' }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No resources found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
            </div>
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      {selectedResource && (
        <BookingDialog
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
          onConfirm={(formData) => addToCart(selectedResource, formData)}
          existingBookings={getResourceBookings(selectedResource.id)}
        />
      )}
    </div>
  );
}

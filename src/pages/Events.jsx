import React, { useState, useEffect } from "react";
import { eventhub } from "@/api/eventhubClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Filter, Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import EventCard from "../components/EventCard";

export default function Events() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await eventhub.events.list();
        console.log('Events fetched:', response);
        // Handle both array and wrapped response formats
        const eventsList = Array.isArray(response) ? response : (response?.data || []);
        setEvents(eventsList);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Handle event registration
  const handleRegister = async (event) => {
    try {
      // Check if already registered
      const bookings = await eventhub.bookings.list();
      const bookingsList = Array.isArray(bookings) ? bookings : (bookings?.data || []);
      const alreadyRegistered = bookingsList.some(booking => 
        booking.event_id === event.id && booking.status === 'confirmed'
      );
      
      if (alreadyRegistered) {
        alert(`You are already registered for "${event.title}"!`);
        return;
      }
      
      const booking = await eventhub.bookings.create({
        booking_type: 'event',
        event_id: event.id,
        date: event.start_date || new Date().toISOString().split('T')[0],
        start_time: '00:00',
        end_time: '23:59',
        status: 'confirmed'
      });
      console.log('Booking created:', booking);
      alert('Successfully registered for event!');
      // Refresh events
      const updatedEvents = await eventhub.events.list();
      const eventsList = Array.isArray(updatedEvents) ? updatedEvents : (updatedEvents?.data || []);
      setEvents(eventsList);
    } catch (err) {
      console.error('Error registering for event:', err);
      
      // Show better error messages
      let errorMessage = 'Failed to register for event';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    }
  };

  // Handle add to cart
  const handleAddToCart = async (event) => {
    try {
      // Check if already in cart
      const savedCart = localStorage.getItem('cart');
      const currentCart = savedCart ? JSON.parse(savedCart) : [];
      
      const alreadyInCart = currentCart.some(item => 
        item.type === 'event' && item.itemId === event.id
      );
      
      if (alreadyInCart) {
        alert('This event is already in your cart!');
        return;
      }
      
      // Check if already registered
      try {
        const bookings = await eventhub.bookings.list();
        const bookingsList = Array.isArray(bookings) ? bookings : (bookings?.data || []);
        const alreadyRegistered = bookingsList.some(booking => 
          booking.event_id === event.id && booking.status === 'confirmed'
        );
        
        if (alreadyRegistered) {
          alert(`You are already registered for "${event.title}"!`);
          return;
        }
      } catch (err) {
        console.error('Error checking existing bookings:', err);
        // Continue anyway if we can't check
      }
      
      const cartItem = {
        type: 'event',
        itemId: event.id,
        name: event.title,
        image: event.image_url,
        startDate: event.start_date,
        totalPrice: event.ticket_price || 0,
      };

      currentCart.push(cartItem);
      localStorage.setItem('cart', JSON.stringify(currentCart));
      window.dispatchEvent(new Event('cartUpdated'));
      alert('Event added to cart!');
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add event to cart');
    }
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      (event.title && event.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || 
      (event.category && event.category.toLowerCase() === categoryFilter.toLowerCase());
    
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", "workshop", "seminar", "conference", "training", "meeting", "social", "other"];

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FAFAF9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-bold mb-2">Error Loading Events</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF9' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Events</h1>
          <p className="text-gray-600">Discover and register for upcoming events</p>
        </div>

        <div className="bg-white rounded-lg p-6 elevation-1 mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div className="flex gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                      categoryFilter === category
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={categoryFilter === category ? { backgroundColor: 'var(--md-primary)' } : {}}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg h-96 elevation-1 animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-lg overflow-hidden elevation-1 hover:elevation-2 transition-all">
                {event.image_url && (
                  <img src={event.image_url} alt={event.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{event.description}</p>
                  
                  <div className="space-y-2 mb-4 text-sm text-gray-700">
                    {event.start_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(event.start_date), "MMMM d, yyyy 'at' h:mm a")}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.capacity && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{event.capacity} seats available</span>
                      </div>
                    )}
                  </div>

                  {event.ticket_price && (
                    <div className="mb-4 text-lg font-bold text-gray-900">
                      ${event.ticket_price}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {event.ticket_price > 0 ? (
                      <button
                        onClick={() => handleAddToCart(event)}
                        className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-all"
                        style={{ backgroundColor: 'var(--md-primary)' }}
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRegister(event)}
                        className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-all"
                        style={{ backgroundColor: 'var(--md-primary)' }}
                      >
                        Register
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-12 elevation-1 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--md-primary)', opacity: 0.1 }}>
                <Search className="w-10 h-10" style={{ color: 'var(--md-primary)' }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

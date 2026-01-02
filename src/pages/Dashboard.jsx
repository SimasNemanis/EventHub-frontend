import React from "react";
import { eventhub } from "@/api/eventhubClient";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Package, TrendingUp, Users, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => eventhub.auth.me(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventhub.entities.Event.list('-date'),
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => eventhub.entities.Resource.list(),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['myBookings', user?.email],
    queryFn: () => eventhub.entities.Booking.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const upcomingEvents = events.filter(e => e.status === 'upcoming').slice(0, 3);
  const availableResources = resources.filter(r => r.available);
  const myActiveBookings = bookings.filter(b => b.status === 'confirmed');

  const stats = [
    {
      title: "Upcoming Events",
      value: events.filter(e => e.status === 'upcoming').length,
      icon: Calendar,
      color: "bg-blue-500",
      link: createPageUrl("Events")
    },
    {
      title: "Available Resources",
      value: availableResources.length,
      icon: Package,
      color: "bg-green-500",
      link: createPageUrl("Resources")
    },
    {
      title: "My Bookings",
      value: myActiveBookings.length,
      icon: TrendingUp,
      color: "bg-purple-500",
      link: createPageUrl("MyBookings")
    },
    {
      title: "Total Events",
      value: events.length,
      icon: Users,
      color: "bg-orange-500",
      link: createPageUrl("Events")
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.full_name || 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Here's what's happening with your events and resources</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Link
              key={index}
              to={stat.link}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 elevation-1 hover-elevation-2 cursor-pointer transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg elevation-1 overflow-hidden transition-colors">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
                <Link
                  to={createPageUrl("Events")}
                  className="text-sm font-medium hover:underline"
                  style={{ color: 'var(--md-primary)' }}
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover-elevation-2"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900 dark:text-white">{event.title}</h3>
                      <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: 'var(--md-primary)' }}>
                        {event.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{event.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(event.date), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{event.start_time}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No upcoming events</p>
                  <Link
                    to={createPageUrl("Events")}
                    className="inline-block mt-4 px-6 py-2 rounded-lg text-white font-medium ripple material-button"
                    style={{ backgroundColor: 'var(--md-primary)' }}
                  >
                    Browse Events
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 elevation-1 transition-colors">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to={createPageUrl("Events")}
                  className="block w-full py-3 rounded-lg text-white font-medium text-center ripple material-button"
                  style={{ backgroundColor: 'var(--md-primary)' }}
                >
                  Browse Events
                </Link>
                <Link
                  to={createPageUrl("Resources")}
                  className="block w-full py-3 rounded-lg border-2 font-medium text-center material-button"
                  style={{ borderColor: 'var(--md-primary)', color: 'var(--md-primary)' }}
                >
                  Book Resource
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg elevation-1 overflow-hidden transition-colors">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Available Resources</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {availableResources.slice(0, 4).map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{resource.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{resource.type}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                  ))}
                </div>
                {availableResources.length > 4 && (
                  <Link
                    to={createPageUrl("Resources")}
                    className="block mt-4 text-center text-sm font-medium hover:underline"
                    style={{ color: 'var(--md-primary)' }}
                  >
                    View all {availableResources.length} resources
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
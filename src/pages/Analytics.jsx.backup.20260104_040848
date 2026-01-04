import React from "react";
import { eventhub } from "@/api/eventhubClient";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Calendar, Package, BarChart3, Download } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventhub.entities.Event.list(),
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => eventhub.entities.Resource.list(),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['allBookings'],
    queryFn: () => eventhub.entities.Booking.list(),
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ['ratings'],
    queryFn: () => eventhub.entities.Rating.list(),
  });

  // Event Stats
  const eventsByCategory = events.reduce((acc, event) => {
    acc[event.category] = (acc[event.category] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.entries(eventsByCategory).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value
  }));

  // Resource Utilization
  const resourcesByType = resources.reduce((acc, resource) => {
    acc[resource.type] = (acc[resource.type] || 0) + 1;
    return acc;
  }, {});

  const resourceTypeData = Object.entries(resourcesByType).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value
  }));

  // Resource Assignment Stats - with safe array handling
  const resourceUsageMap = {};
  resources.forEach(resource => {
    const assignedEvents = events.filter(e => {
      const resourceIds = e.assigned_resource_ids || [];
      return Array.isArray(resourceIds) && resourceIds.includes(resource.id);
    });
    resourceUsageMap[resource.id] = {
      name: resource.name,
      type: resource.type,
      totalAssignments: assignedEvents.length
    };
  });

  const topUsedResources = Object.values(resourceUsageMap)
    .filter(r => r.totalAssignments > 0)
    .sort((a, b) => b.totalAssignments - a.totalAssignments)
    .slice(0, 5)
    .map(r => ({
      name: r.name,
      assignments: r.totalAssignments
    }));

  // Booking Trends (last 6 months)
  const bookingsByMonth = bookings.reduce((acc, booking) => {
    const month = new Date(booking.date).toLocaleString('default', { month: 'short', year: '2-digit' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const trendData = Object.entries(bookingsByMonth).map(([month, count]) => ({
    month,
    bookings: count
  })).slice(-6);

  // Rating Stats
  const averageRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : 0;

  const stats = [
    {
      title: "Total Events",
      value: events.length,
      change: "+12%",
      icon: Calendar,
      color: "bg-blue-500"
    },
    {
      title: "Total Resources",
      value: resources.length,
      change: "+8%",
      icon: Package,
      color: "bg-green-500"
    },
    {
      title: "Total Bookings",
      value: bookings.length,
      change: "+23%",
      icon: TrendingUp,
      color: "bg-purple-500"
    },
    {
      title: "Avg Rating",
      value: averageRating,
      change: "+0.3",
      icon: BarChart3,
      color: "bg-orange-500"
    }
  ];

  const COLORS = ['#1976d2', '#42a5f5', '#64b5f6', '#90caf9', '#bbdefb'];

  const exportReport = () => {
    const reportData = {
      generated: new Date().toISOString(),
      summary: {
        totalEvents: events.length,
        totalResources: resources.length,
        totalBookings: bookings.length,
        averageRating: averageRating
      },
      eventsByCategory,
      resourcesByType,
      bookingTrends: bookingsByMonth,
      resourceUsage: resourceUsageMap
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics & Reports</h1>
            <p className="text-gray-600 dark:text-gray-400">Insights and statistics about your platform</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportReport}
              className="px-6 py-3 rounded-lg text-white font-medium ripple material-button flex items-center gap-2"
              style={{ backgroundColor: 'var(--md-primary)' }}
            >
              <Download className="w-5 h-5" />
              Export JSON
            </button>
            <button
              onClick={async () => {
                const response = await eventhub.functions.invoke('exportBookingsCSV');
                const blob = new Blob([response.data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
              }}
              className="px-6 py-3 rounded-lg bg-green-600 text-white font-medium ripple material-button flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export Bookings CSV
            </button>
            <button
              onClick={async () => {
                const response = await eventhub.functions.invoke('exportOrdersCSV');
                const blob = new Blob([response.data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
              }}
              className="px-6 py-3 rounded-lg bg-purple-600 text-white font-medium ripple material-button flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export Orders CSV
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 elevation-1 hover-elevation-2 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-green-600 text-sm font-medium">{stat.change}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Event Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 elevation-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Events by Category</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No event data yet</p>
            )}
          </div>

          {/* Resource Types */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 elevation-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Resources by Type</h3>
            {resourceTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resourceTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No resource data yet</p>
            )}
          </div>
        </div>

        {/* New: Top Used Resources */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 elevation-1 mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Most Used Resources</h3>
          {topUsedResources.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topUsedResources} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="assignments" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No resource usage data yet</p>
          )}
        </div>

        {/* Booking Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 elevation-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Booking Trends (Last 6 Months)</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="bookings" stroke="#1976d2" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No booking data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save, X, RefreshCw, AlertTriangle, Package } from "lucide-react";
import { eventhub } from "@/api/eventhubClient";
import { useQuery } from "@tanstack/react-query";

export default function EventForm({ event, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(event || {
    title: '',
    description: '',
    category: 'workshop',
    date: '',
    start_time: '09:00',
    end_time: '17:00',
    location: '',
    capacity: 30,
    registered_count: 0,
    image_url: '',
    status: 'active',
    ticket_price: 0,
    is_recurring: false,
    recurrence_pattern: 'weekly',
    recurrence_end_date: '',
    assigned_resource_ids: []
  });

  const [resourceConflicts, setResourceConflicts] = useState([]);

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => eventhub.entities.Resource.list(),
  });

  const { data: allEvents = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventhub.entities.Event.list(),
  });

  useEffect(() => {
    checkResourceConflicts();
  }, [formData.date, formData.start_time, formData.end_time, formData.assigned_resource_ids]);

  const checkResourceConflicts = () => {
    const resourceIds = formData.assigned_resource_ids || [];
    
    if (!formData.date || !formData.start_time || !formData.end_time || resourceIds.length === 0) {
      setResourceConflicts([]);
      return;
    }

    const conflicts = [];
    
    resourceIds.forEach(resourceId => {
      const conflictingEvents = allEvents.filter(e => {
        if (event && e.id === event.id) return false;
        if (e.date !== formData.date) return false;
        
        const eventResourceIds = e.assigned_resource_ids || [];
        if (!eventResourceIds.includes(resourceId)) return false;

        return (
          (formData.start_time >= e.start_time && formData.start_time < e.end_time) ||
          (formData.end_time > e.start_time && formData.end_time <= e.end_time) ||
          (formData.start_time <= e.start_time && formData.end_time >= e.end_time)
        );
      });

      if (conflictingEvents.length > 0) {
        const resource = resources.find(r => r.id === resourceId);
        conflicts.push({
          resourceId,
          resourceName: resource?.name || 'Unknown',
          events: conflictingEvents
        });
      }
    });

    setResourceConflicts(conflicts);
  };

  const toggleResource = (resourceId) => {
    const currentIds = formData.assigned_resource_ids || [];
    const newIds = currentIds.includes(resourceId)
      ? currentIds.filter(id => id !== resourceId)
      : [...currentIds, resourceId];
    
    setFormData({ ...formData, assigned_resource_ids: newIds });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (resourceConflicts.length > 0) {
      alert('Please resolve resource conflicts before saving.');
      return;
    }
    
    // Transform form data to match API expectations
    const apiData = {
      title: formData.title,
      description: formData.description,
      category: formData.category.toLowerCase(),
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      location: formData.location,
      capacity: parseInt(formData.capacity) || 0,
      status: formData.status,
      ticket_price: parseFloat(formData.ticket_price) || 0
    };
    
    // Only add image_url if it's not empty
    if (formData.image_url && formData.image_url.trim()) {
      apiData.image_url = formData.image_url;
    }
    
    onSubmit(apiData);
  };

  const availableResources = resources.filter(r => r.available);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="title">Event Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({...formData, category: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="seminar">Seminar</SelectItem>
              <SelectItem value="conference">Conference</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="h-24"
          />
        </div>

        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
          />
        </div>

        <div>
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({...formData, start_time: e.target.value})}
            required
          />
        </div>

        <div>
          <Label htmlFor="end_time">End Time</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({...formData, end_time: e.target.value})}
            required
          />
        </div>

        <div>
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            min="1"
            value={formData.capacity}
            onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
            required
          />
        </div>

        <div>
          <Label htmlFor="ticket_price">Ticket Price ($) - Set to 0 for free</Label>
          <Input
            id="ticket_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.ticket_price}
            onChange={(e) => setFormData({...formData, ticket_price: parseFloat(e.target.value) || 0})}
            required
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({...formData, status: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="image_url">Image URL</Label>
          <Input
            id="image_url"
            value={formData.image_url}
            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
            placeholder="https://..."
          />
        </div>

        {/* Resource Assignment */}
        <div className="md:col-span-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5" style={{ color: 'var(--md-primary)' }} />
            <Label className="text-base font-semibold">Assign Resources</Label>
          </div>
          
          {availableResources.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {availableResources.map(resource => (
                <label
                  key={resource.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.assigned_resource_ids?.includes(resource.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.assigned_resource_ids?.includes(resource.id)}
                    onChange={() => toggleResource(resource.id)}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{resource.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{resource.type}</p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">No available resources. Create resources first.</p>
          )}

          {formData.assigned_resource_ids?.length > 0 && (
            <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
              ✅ {formData.assigned_resource_ids.length} resource(s) assigned
            </div>
          )}
        </div>

        {/* Conflict Warnings */}
        {resourceConflicts.length > 0 && (
          <div className="md:col-span-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900 dark:text-red-200 mb-2">Resource Conflicts Detected</p>
                {resourceConflicts.map((conflict, index) => (
                  <div key={index} className="mb-2 text-sm text-red-800 dark:text-red-300">
                    <p className="font-medium">• {conflict.resourceName}</p>
                    <p className="ml-4 text-xs">
                      Conflict with: {conflict.events.map(e => e.title).join(', ')}
                    </p>
                  </div>
                ))}
                <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                  Please change the date/time or remove conflicting resources.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recurring Event Section */}
        <div className="md:col-span-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" style={{ color: 'var(--md-primary)' }} />
              <Label className="text-base font-semibold">Recurring Event</Label>
            </div>
            <Switch
              checked={formData.is_recurring}
              onCheckedChange={(checked) => setFormData({...formData, is_recurring: checked})}
            />
          </div>

          {formData.is_recurring && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recurrence_pattern">Repeat Pattern</Label>
                <Select
                  value={formData.recurrence_pattern}
                  onValueChange={(value) => setFormData({...formData, recurrence_pattern: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="recurrence_end_date">End Recurrence Date</Label>
                <Input
                  id="recurrence_end_date"
                  type="date"
                  value={formData.recurrence_end_date}
                  onChange={(e) => setFormData({...formData, recurrence_end_date: e.target.value})}
                  min={formData.date}
                  required={formData.is_recurring}
                />
              </div>

              <div className="md:col-span-2 text-sm text-gray-600 dark:text-gray-400">
                💡 Recurring events will use the same assigned resources for all instances.
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-lg border border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors material-button flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={resourceConflicts.length > 0}
          className={`flex-1 py-3 rounded-lg font-medium text-white ripple material-button flex items-center justify-center gap-2 ${
            resourceConflicts.length > 0 ? 'bg-gray-400 cursor-not-allowed' : ''
          }`}
          style={resourceConflicts.length === 0 ? { backgroundColor: 'var(--md-primary)' } : {}}
        >
          <Save className="w-5 h-5" />
          {event ? 'Update Event' : formData.is_recurring ? 'Create Recurring Events' : 'Create Event'}
        </button>
      </div>
    </form>
  );
}
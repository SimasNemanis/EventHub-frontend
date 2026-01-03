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
  // Parse event data if editing
  const parseEventData = (eventData) => {
    if (!eventData || !eventData.id) return null;
    
    let date = '';
    let start_time = '09:00';
    let end_time = '17:00';
    
    // Parse start_date and end_date if they exist
    if (eventData.start_date) {
      const startDate = new Date(eventData.start_date);
      date = startDate.toISOString().split('T')[0]; // Extract YYYY-MM-DD
      start_time = startDate.toTimeString().slice(0, 5); // Extract HH:MM
    }
    
    if (eventData.end_date) {
      const endDate = new Date(eventData.end_date);
      end_time = endDate.toTimeString().slice(0, 5); // Extract HH:MM
    }
    
    return {
      ...eventData,
      date,
      start_time,
      end_time
    };
  };
  
  const [formData, setFormData] = useState(parseEventData(event) || {
    title: '',
    description: '',
    category: 'workshop',
    date: new Date().toISOString().split('T')[0],
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
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => eventhub.entities.Resource.list(),
  });

  const { data: allEvents = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventhub.entities.Event.list(),
  });

  // Update formData when event prop changes (for editing)
  useEffect(() => {
    if (event && event.id) {
      const parsedData = parseEventData(event);
      if (parsedData) {
        setFormData(parsedData);
      }
    }
  }, [event?.id]);

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

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title || !formData.title.trim()) {
      errors.title = 'Event title is required';
    }
    if (!formData.date) {
      errors.date = 'Event date is required';
    }
    if (!formData.location || !formData.location.trim()) {
      errors.location = 'Location is required';
    }
    if (!formData.start_time) {
      errors.start_time = 'Start time is required';
    }
    if (!formData.end_time) {
      errors.end_time = 'End time is required';
    }
    if (formData.start_time >= formData.end_time) {
      errors.end_time = 'End time must be after start time';
    }
    if (formData.capacity < 1) {
      errors.capacity = 'Capacity must be at least 1';
    }
    if (formData.ticket_price < 0) {
      errors.ticket_price = 'Ticket price cannot be negative';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitError('');
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    if (resourceConflicts.length > 0) {
      setSubmitError('Please resolve resource conflicts before saving.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let apiData;

      if (event && event.id) {
        // UPDATE operation
        let dateString = formData.date;
        if (formData.date instanceof Date) {
          dateString = formData.date.toISOString().split('T')[0];
        }
        const start_date = `${dateString}T${formData.start_time}:00`;
        const end_date = `${dateString}T${formData.end_time}:00`;

        apiData = {
          title: formData.title,
          description: formData.description,
          category: formData.category.toLowerCase(),
          start_date,
          end_date,
          location: formData.location,
          capacity: parseInt(formData.capacity) || 0,
          status: formData.status,
          ticket_price: parseFloat(formData.ticket_price) || 0
        };
      } else {
        // CREATE operation
        apiData = {
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
      }
      
      // Only add image_url if it's not empty
      if (formData.image_url && formData.image_url.trim()) {
        apiData.image_url = formData.image_url;
      }
      
      console.log('Submitting API data:', apiData);
      await onSubmit(apiData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(error.message || 'Failed to save event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableResources = resources.filter(r => r.available);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm">{submitError}</p>
          </div>
        </div>
      )}

      {resourceConflicts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium mb-2">Resource Conflicts</p>
          {resourceConflicts.map(conflict => (
            <div key={conflict.resourceId} className="text-yellow-700 text-sm mb-2">
              <strong>{conflict.resourceName}</strong> is already assigned to {conflict.events.length} event(s) at this time.
            </div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="title">Event Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className={formErrors.title ? 'border-red-500' : ''}
          />
          {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
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
            className={formErrors.date ? 'border-red-500' : ''}
          />
          {formErrors.date && <p className="text-red-500 text-sm mt-1">{formErrors.date}</p>}
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            className={formErrors.location ? 'border-red-500' : ''}
          />
          {formErrors.location && <p className="text-red-500 text-sm mt-1">{formErrors.location}</p>}
        </div>

        <div>
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({...formData, start_time: e.target.value})}
            className={formErrors.start_time ? 'border-red-500' : ''}
          />
          {formErrors.start_time && <p className="text-red-500 text-sm mt-1">{formErrors.start_time}</p>}
        </div>

        <div>
          <Label htmlFor="end_time">End Time</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({...formData, end_time: e.target.value})}
            className={formErrors.end_time ? 'border-red-500' : ''}
          />
          {formErrors.end_time && <p className="text-red-500 text-sm mt-1">{formErrors.end_time}</p>}
        </div>

        <div>
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            min="1"
            value={formData.capacity}
            onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
            className={formErrors.capacity ? 'border-red-500' : ''}
          />
          {formErrors.capacity && <p className="text-red-500 text-sm mt-1">{formErrors.capacity}</p>}
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
            className={formErrors.ticket_price ? 'border-red-500' : ''}
          />
          {formErrors.ticket_price && <p className="text-red-500 text-sm mt-1">{formErrors.ticket_price}</p>}
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
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5" />
            <Label className="text-base font-semibold">Assign Resources</Label>
          </div>
          
          {availableResources.length === 0 ? (
            <p className="text-gray-500 text-sm">No available resources. Create resources first.</p>
          ) : (
            <div className="space-y-2">
              {availableResources.map(resource => (
                <div key={resource.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`resource-${resource.id}`}
                    checked={(formData.assigned_resource_ids || []).includes(resource.id)}
                    onChange={() => toggleResource(resource.id)}
                    className="rounded"
                  />
                  <label htmlFor={`resource-${resource.id}`} className="text-sm cursor-pointer">
                    {resource.name}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recurring Event */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.is_recurring}
              onCheckedChange={(checked) => setFormData({...formData, is_recurring: checked})}
            />
            <Label>Make this a recurring event</Label>
          </div>
        </div>

        {formData.is_recurring && (
          <>
            <div>
              <Label htmlFor="recurrence_pattern">Recurrence Pattern</Label>
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
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="recurrence_end_date">Recurrence End Date</Label>
              <Input
                id="recurrence_end_date"
                type="date"
                value={formData.recurrence_end_date}
                onChange={(e) => setFormData({...formData, recurrence_end_date: e.target.value})}
              />
            </div>
          </>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          <X className="w-4 h-4 inline mr-2" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {event && event.id ? 'Update Event' : 'Create Event'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

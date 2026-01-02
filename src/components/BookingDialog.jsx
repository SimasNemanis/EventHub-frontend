import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function BookingDialog({ resource, onClose, onConfirm, existingBookings }) {
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    date: today,
    start_time: "09:00",
    end_time: "10:00",
    purpose: "",
    notes: ""
  });
  const [conflict, setConflict] = useState(null);

  const checkConflict = (date, startTime, endTime) => {
    const conflicts = existingBookings.filter(booking => {
      if (booking.date !== date) return false;
      
      const bookingStart = booking.start_time;
      const bookingEnd = booking.end_time;
      
      return (
        (startTime >= bookingStart && startTime < bookingEnd) ||
        (endTime > bookingStart && endTime <= bookingEnd) ||
        (startTime <= bookingStart && endTime >= bookingEnd)
      );
    });
    
    return conflicts.length > 0 ? conflicts[0] : null;
  };

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    if (field === 'date' || field === 'start_time' || field === 'end_time') {
      const conflictFound = checkConflict(newData.date, newData.start_time, newData.end_time);
      setConflict(conflictFound);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!conflict) {
      onConfirm(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full elevation-5 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Book Resource</h2>
            <p className="text-sm text-gray-600 mt-1">{resource.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date */}
          <div>
            <Label htmlFor="date" className="text-sm font-medium text-gray-700 mb-2 block">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              min={today}
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full"
              required
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time" className="text-sm font-medium text-gray-700 mb-2 block">
                Start Time
              </Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
                className="w-full"
                required
              />
            </div>
            <div>
              <Label htmlFor="end_time" className="text-sm font-medium text-gray-700 mb-2 block">
                End Time
              </Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
                className="w-full"
                required
              />
            </div>
          </div>

          {/* Conflict Warning */}
          {conflict && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Time Conflict Detected</p>
                <p className="text-sm text-red-700 mt-1">
                  This resource is already booked from {conflict.start_time} to {conflict.end_time}
                </p>
              </div>
            </div>
          )}

          {/* Purpose */}
          <div>
            <Label htmlFor="purpose" className="text-sm font-medium text-gray-700 mb-2 block">
              Purpose
            </Label>
            <Input
              id="purpose"
              type="text"
              placeholder="e.g., Team meeting, Workshop"
              value={formData.purpose}
              onChange={(e) => handleChange('purpose', e.target.value)}
              className="w-full"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-2 block">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Any special requirements or notes..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full h-20"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 transition-colors material-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={conflict}
              className={`flex-1 py-3 rounded-lg font-medium text-white ripple material-button ${
                conflict ? 'bg-gray-400 cursor-not-allowed' : ''
              }`}
              style={!conflict ? { backgroundColor: 'var(--md-primary)' } : {}}
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
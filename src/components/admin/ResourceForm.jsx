import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save, X, Plus, Trash2 } from "lucide-react";

export default function ResourceForm({ resource, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(resource || {
    name: '',
    type: 'room',
    description: '',
    capacity: 0,
    location: '',
    image_url: '',
    features: [],
    available: true,
    price_per_day: 0
  });

  const [newFeature, setNewFeature] = useState('');

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Don't send empty image_url
    const submitData = { ...formData };
    if (!submitData.image_url || submitData.image_url.trim() === '' || submitData.image_url === 'https://...') {
      delete submitData.image_url;
    }
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name">Resource Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>

        <div>
          <Label htmlFor="type">Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({...formData, type: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="room">Room</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="vehicle">Vehicle</SelectItem>
              <SelectItem value="facility">Facility</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
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
          <Label htmlFor="capacity">Capacity (Optional)</Label>
          <Input
            id="capacity"
            type="number"
            min="0"
            value={formData.capacity || ''}
            onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 0})}
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
          <Label htmlFor="price_per_day">Price per Day ($)</Label>
          <Input
            id="price_per_day"
            type="number"
            step="0.01"
            min="0"
            value={formData.price_per_day}
            onChange={(e) => setFormData({...formData, price_per_day: parseFloat(e.target.value) || 0})}
            required
          />
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

        <div className="md:col-span-2">
          <Label>Features</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add a feature..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            />
            <button
              type="button"
              onClick={addFeature}
              className="px-4 py-2 rounded-lg text-white material-button"
              style={{ backgroundColor: 'var(--md-primary)' }}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(formData.features || []).map((feature, index) => (
              <div
                key={index}
                className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2"
              >
                <span className="text-sm">{feature}</span>
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label>Available</Label>
              <p className="text-sm text-gray-600">Mark resource as available for booking</p>
            </div>
            <Switch
              checked={formData.available}
              onCheckedChange={(checked) => setFormData({...formData, available: checked})}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 transition-colors material-button flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-lg font-medium text-white ripple material-button flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--md-primary)' }}
        >
          <Save className="w-5 h-5" />
          {resource ? 'Update Resource' : 'Create Resource'}
        </button>
      </div>
    </form>
  );
}
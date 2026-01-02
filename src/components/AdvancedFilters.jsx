import React, { useState } from "react";
import { Filter, X, DollarSign, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdvancedFilters({ onApplyFilters, onClearFilters, type = "event" }) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    startDate: "",
    endDate: "",
    categories: [],
    status: "all"
  });

  const eventCategories = ["workshop", "seminar", "conference", "training", "meeting", "social", "other"];
  const resourceTypes = ["room", "equipment", "vehicle", "facility", "technology", "other"];

  const options = type === "event" ? eventCategories : resourceTypes;

  const handleApply = () => {
    onApplyFilters(filters);
    setShowFilters(false);
  };

  const handleClear = () => {
    const emptyFilters = {
      minPrice: "",
      maxPrice: "",
      startDate: "",
      endDate: "",
      categories: [],
      status: "all"
    };
    setFilters(emptyFilters);
    onClearFilters();
    setShowFilters(false);
  };

  const toggleCategory = (category) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
      >
        <Filter className="w-5 h-5" />
        Advanced Filters
        {(filters.minPrice || filters.maxPrice || filters.startDate || filters.endDate || filters.categories.length > 0) && (
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
        )}
      </button>

      {showFilters && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setShowFilters(false)}
          ></div>
          
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg elevation-3 p-6 z-50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Advanced Filters</h3>
              <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Price Range */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Price Range
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date Range
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="flex-1"
                  />
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Categories/Types */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  {type === "event" ? "Categories" : "Resource Types"}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {options.map((option) => (
                    <button
                      key={option}
                      onClick={() => toggleCategory(option)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filters.categories.includes(option)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter (for events) */}
              {type === "event" && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Status
                  </Label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleClear}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-2 rounded-lg text-white font-medium transition-colors"
                style={{ backgroundColor: 'var(--md-primary)' }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
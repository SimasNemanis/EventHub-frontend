import React, { useState } from "react";
import { Edit, Trash2, MapPin, Users, CheckCircle, XCircle, DollarSign } from "lucide-react";
import ConfirmDialog from "../ConfirmDialog";

export default function ResourceList({ resources, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl mb-4 block">📦</span>
        <p className="text-gray-500">No resources yet. Create your first resource!</p>
      </div>
    );
  }

  const isAvailable = (resource) => {
    return resource.availability_status === 'available' || resource.availability_status === 'Available';
  };

  return (
    <div className="space-y-4">
      {resources.map((resource) => (
        <div key={resource.id} className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold text-gray-900">{resource.name}</h3>
                {isAvailable(resource) ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--md-primary)', color: 'white' }}>
                {resource.availability_status || 'Unknown'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(resource)}
                className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Edit className="w-5 h-5 text-blue-600" />
              </button>
              <button
                onClick={() => setConfirmDelete(resource)}
                className="p-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>

          <p className="text-gray-600 mb-3 line-clamp-2">{resource.description}</p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-700">
            {resource.daily_price && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>${parseFloat(resource.daily_price).toFixed(2)}/day</span>
              </div>
            )}
            {resource.requires_approval && (
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                  Requires Approval
                </span>
              </div>
            )}
          </div>

          {resource.owner_id && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Owner ID: {resource.owner_id}
              </p>
            </div>
          )}
        </div>
      ))}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          onDelete(confirmDelete.id);
          setConfirmDelete(null);
        }}
        title="Delete Resource"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Resource"
        confirmColor="red"
      />
    </div>
  );
}

// Entity wrappers for backward compatibility
import { eventhub } from './eventhubClient';

// Helper to normalize API responses
const normalizeResponse = (response) => {
  return Array.isArray(response) ? response : (response?.data || []);
};

export const Event = {
  list: async () => {
    const response = await eventhub.events.list();
    return normalizeResponse(response);
  },
  get: (id) => eventhub.events.get(id),
  create: (data) => eventhub.events.create(data),
  update: (id, data) => eventhub.events.update(id, data),
  delete: (id) => eventhub.events.delete(id),
};

export const Resource = {
  list: async () => {
    const response = await eventhub.resources.list();
    return normalizeResponse(response);
  },
  get: (id) => eventhub.resources.get(id),
  create: (data) => eventhub.resources.create(data),
  update: (id, data) => eventhub.resources.update(id, data),
  delete: (id) => eventhub.resources.delete(id),
};

export const Booking = {
  list: async () => {
    const response = await eventhub.bookings.list();
    return normalizeResponse(response);
  },
  get: (id) => eventhub.bookings.get(id),
  create: (data) => eventhub.bookings.create(data),
  update: (id, data) => eventhub.bookings.update(id, data),
  delete: (id) => eventhub.bookings.delete(id),
  filter: async (filters) => {
    // For now, get all and filter client-side
    // TODO: Implement server-side filtering
    const response = await eventhub.bookings.list();
    const bookings = normalizeResponse(response);
    if (!filters) return bookings;
    
    return bookings.filter(booking => {
      for (const [key, value] of Object.entries(filters)) {
        if (booking[key] !== value) return false;
      }
      return true;
    });
  },
};

export const Rating = {
  list: async () => {
    const response = await eventhub.ratings.list();
    return normalizeResponse(response);
  },
  create: (data) => eventhub.ratings.create(data),
  update: (id, data) => eventhub.ratings.update(id, data),
  delete: (id) => eventhub.ratings.delete(id),
};

export const Order = {
  list: async () => {
    const response = await eventhub.orders.list();
    return normalizeResponse(response);
  },
  get: (id) => eventhub.orders.get(id),
  create: (data) => eventhub.orders.create(data),
  update: (id, data) => eventhub.orders.update(id, data),
};

export const User = eventhub.auth;

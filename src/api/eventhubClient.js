// EventHub API Client - Replaces Base44
const API_URL = 'http://46.224.28.13:3000/api'; // Direct backend connection

class EventHubClient {
  constructor() {
    this.baseURL = API_URL;
    this.token = localStorage.getItem('token');
    // Initialize token in headers if it exists
    if (this.token) {
      console.log('Token found in localStorage');
    }
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
      // Also set Authorization header for future requests
    } else {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401) {
      this.setToken(null);
      // Don't redirect for auth/me checks - let the caller handle it
      if (!options.skipRedirect && endpoint !== '/auth/me') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  auth = {
    register: (full_name, email, password) =>
      this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ full_name, email, password }),
      }),

    login: (email, password) => {
      const client = this;
      console.log('Login API URL:', client.baseURL + '/auth/login');
      return this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }).then(data => {
        console.log('Login response data:', data);
        console.log('Token in response:', !!data.token);
        if (data.token) {
          console.log('Setting token:', data.token.substring(0, 50));
          client.setToken(data.token);
        }
        return data;
      });
    },

    me: () => this.request('/auth/me'),

    isAuthenticated: () => {
      return this.request('/auth/me')
        .then(() => true)
        .catch(() => false);
    },

    logout: () => {
      this.setToken(null);
      // Call backend logout endpoint if needed
      return this.request('/auth/logout', {
        method: 'POST',
      }).catch(() => {
        // Ignore errors on logout
      });
    },

    updateProfile: (userData) =>
      this.request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(userData),
      }),

    updateMe: (userData) =>
      this.request('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(userData),
      }),
  };

  // Events endpoints
  events = {
    list: () => this.request('/events'),

    get: (id) => this.request(`/events/${id}`),

    create: (eventData) =>
      this.request('/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      }),

    update: (id, eventData) =>
      this.request(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(eventData),
      }),

    delete: (id) =>
      this.request(`/events/${id}`, {
        method: 'DELETE',
      }),

    search: (query) => this.request(`/events?search=${query}`),
  };

  // Resources endpoints
  resources = {
    list: () => this.request('/resources'),

    get: (id) => this.request(`/resources/${id}`),

    create: (resourceData) =>
      this.request('/resources', {
        method: 'POST',
        body: JSON.stringify(resourceData),
      }),

    update: (id, resourceData) =>
      this.request(`/resources/${id}`, {
        method: 'PUT',
        body: JSON.stringify(resourceData),
      }),

    delete: (id) =>
      this.request(`/resources/${id}`, {
        method: 'DELETE',
      }),
  };

  // Bookings endpoints
  bookings = {
    list: () => this.request('/bookings'),

    get: (id) => this.request(`/bookings/${id}`),

    create: (bookingData) =>
      this.request('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      }),

    update: (id, bookingData) =>
      this.request(`/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(bookingData),
      }),

    delete: (id) =>
      this.request(`/bookings/${id}`, {
        method: 'DELETE',
      }),

    approve: (id) =>
      this.request(`/bookings/${id}/approve`, {
        method: 'PUT',
      }),

    reject: (id, reason) =>
      this.request(`/bookings/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ rejection_reason: reason }),
      }),
  };

  // Cart endpoints
  cart = {
    list: () => this.request('/cart'),

    add: (itemData) =>
      this.request('/cart', {
        method: 'POST',
        body: JSON.stringify(itemData),
      }),

    remove: (itemId) =>
      this.request(`/cart/${itemId}`, {
        method: 'DELETE',
      }),

    clear: () =>
      this.request('/cart', {
        method: 'DELETE',
      }),

    update: (itemId, quantity) =>
      this.request(`/cart/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      }),
  };

  // Payments endpoints
  payments = {
    createPayPalOrder: (orderData) =>
      this.request('/payments/create-paypal-order', {
        method: 'POST',
        body: JSON.stringify(orderData),
      }),

    capturePayPalOrder: (orderId) =>
      this.request('/payments/capture-paypal-order', {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      }),

    getInvoice: (invoiceId) => this.request(`/invoices/${invoiceId}`),

    listInvoices: () => this.request('/invoices'),
  };

  // Ratings endpoints
  ratings = {
    list: () => this.request('/ratings'),

    create: (ratingData) =>
      this.request('/ratings', {
        method: 'POST',
        body: JSON.stringify(ratingData),
      }),

    update: (id, ratingData) =>
      this.request(`/ratings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(ratingData),
      }),

    delete: (id) =>
      this.request(`/ratings/${id}`, {
        method: 'DELETE',
      }),
  };

  // Users endpoints
  users = {
    list: () => this.request('/users'),

    get: (id) => this.request(`/users/${id}`),

    update: (id, userData) =>
      this.request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      }),

    delete: (id) =>
      this.request(`/users/${id}`, {
        method: 'DELETE',
      }),

    changeRole: (id, role) =>
      this.request(`/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),

    inviteUser: (email, role) =>
      this.request('/users/invite', {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      }),
  };

  // Event Resources endpoints
  eventResources = {
    assign: (eventId, resourceId) =>
      this.request('/event-resources', {
        method: 'POST',
        body: JSON.stringify({ eventId, resourceId }),
      }),

    getByEvent: (eventId) => this.request(`/event-resources/event/${eventId}`),

    remove: (eventId, resourceId) =>
      this.request(`/event-resources/event/${eventId}/resource/${resourceId}`, {
        method: 'DELETE',
      }),
  };

  // Orders endpoints
  orders = {
    list: () => this.request('/orders'),

    get: (id) => this.request(`/orders/${id}`),

    create: (orderData) =>
      this.request('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      }),

    update: (id, orderData) =>
      this.request(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(orderData),
      }),
  };

  // Analytics endpoints
  analytics = {
    getDashboard: () => this.request('/analytics/dashboard'),

    getEventStats: (eventId) => this.request(`/analytics/events/${eventId}`),

    getResourceStats: (resourceId) => this.request(`/analytics/resources/${resourceId}`),
  };
}

export const eventhub = new EventHubClient();

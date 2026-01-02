import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "690c4af43a801821e2826b57", 
  requiresAuth: true // Ensure authentication is required for all operations
});

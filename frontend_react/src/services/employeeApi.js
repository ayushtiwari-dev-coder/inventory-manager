// LOCATION: frontend_react/src/services/employeeApi.js

import apiClient from './apiClient';

export const employeeApi = {
  getMembers: () => 
    apiClient('/org/members', { method: 'GET', requireAuth: true }),
  removeMember: (userId) => 
    apiClient(`/org/members/${userId}`, { method: 'DELETE', requireAuth: true }),
  changeRole: (data) => 
    apiClient('/org/members/role', { method: 'PUT', data, requireAuth: true }),

  // --- NEW BAN SYSTEM ENDPOINTS ---
  getBanned: () => 
    apiClient('/org/members/banned', { method: 'GET', requireAuth: true }),
  unbanMember: (userId) => 
    apiClient(`/org/members/banned/${userId}`, { method: 'DELETE', requireAuth: true })
};
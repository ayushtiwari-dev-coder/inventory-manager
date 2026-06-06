// LOCATION: frontend_react/src/services/employeeApi.js

import apiClient from './apiClient';

export const employeeApi = {
  getMembers: () => 
    apiClient('/org/members', { method: 'GET', requireAuth: true }),
  
  removeMember: (userId) => 
    apiClient(`/org/members/${userId}`, { method: 'DELETE', requireAuth: true }),

  // For future implementation:
  changeRole: (data) => 
    apiClient('/org/members/role', { method: 'PUT', data, requireAuth: true })
};
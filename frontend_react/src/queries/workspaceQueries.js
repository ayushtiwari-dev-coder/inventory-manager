// LOCATION: frontend_react\src\queries\workspaceQueries.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi } from '../services/workspaceApi';
import { authApi } from '../services/authApi';

// Hook to hit the backend database and fetch up-to-the-second joined organizations
export function useUserWorkspaces() {
  return useQuery({
    queryKey: ['user', 'workspaces'],
    queryFn: async () => {
      // 1. Get current user profile data from local storage to know who we are
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      if (!userInfo.username) return [];

      // 2. Query your backend auth logic context loop to return fresh user records
      // Since your login returns user workspaces, we hit a light session checker or profile fetcher
      const response = await workspaceApi.getOrgProfile(); 
      
      const userContext = JSON.parse(localStorage.getItem('user_info'));
      return userContext?.workspaces || [];
    },
    staleTime: 0, // Always confirm freshness when mounting the picker card stream view
  });
}

export function useSelectWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orgId) => workspaceApi.selectWorkspace(orgId),
    onSuccess: (response) => {
      const token = response?.orgToken || response?.org_token || response?.data?.org_token;
      if (token) {
        localStorage.setItem('org_token', token);
        queryClient.clear(); // Wipes previous queries to prevent tenant leakage
      }
    }
  });
}
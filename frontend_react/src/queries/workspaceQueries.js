// LOCATION: frontend_react\src\queries\workspaceQueries.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi } from '../services/workspaceApi';
import { authApi } from '../services/authApi';

// Hook to hit the backend database and fetch up-to-the-second joined organizations
export function useUserWorkspaces() {
  return useQuery({
    queryKey: ['user', 'workspaces'],
    queryFn: async () => {

      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      if (!userInfo.username) return [];

     
      const response = await workspaceApi.getOrgProfile(); 
      
      const userContext = JSON.parse(localStorage.getItem('user_info'));
      return userContext?.workspaces || [];
    },
    staleTime: 0, 
  });
}


export function useSelectWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orgId) => workspaceApi.selectWorkspace(orgId),
    onSuccess: (response) => {
      queryClient.clear(); // Wipes previous queries to prevent tenant leakage
    }
  });
}
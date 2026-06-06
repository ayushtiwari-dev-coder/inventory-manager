// LOCATION: frontend_react/src/queries/employeeQueries.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../services/employeeApi';
import { QUERY_KEYS } from './queryKeys';

export function useEmployees() {
  return useQuery({
    queryKey: QUERY_KEYS.EMPLOYEES,
    queryFn: async () => {
      const res = await employeeApi.getMembers();
      return Array.isArray(res?.data) ? res.data : [];
    }
  });
}

// Hook for fetching banned users (Will auto-fail with 403 if not Owner)
export function useBannedUsers() {
  return useQuery({
    queryKey: ['banned_users'],
    queryFn: async () => {
      const res = await employeeApi.getBanned();
      return Array.isArray(res?.data) ? res.data : [];
    },
    retry: false // Don't retry if it fails due to permissions (403)
  });
}

export function useEmployeeMutations() {
  const queryClient = useQueryClient();

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => employeeApi.removeMember(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYEES });
      queryClient.invalidateQueries({ queryKey: ['banned_users'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LOGS.ALL });
    }
  });

  const unbanMemberMutation = useMutation({
    mutationFn: (userId) => employeeApi.unbanMember(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banned_users'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LOGS.ALL });
    }
  });

  return {
    removeMember: removeMemberMutation.mutateAsync,
    isRemoving: removeMemberMutation.isPending,
    unbanMember: unbanMemberMutation.mutateAsync,
    isUnbanning: unbanMemberMutation.isPending
  };
}
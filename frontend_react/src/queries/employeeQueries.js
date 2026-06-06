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

export function useEmployeeMutations() {
  const queryClient = useQueryClient();

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => employeeApi.removeMember(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYEES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LOGS.ALL }); // Trigger logs refresh
    }
  });

  return {
    removeMember: removeMemberMutation.mutateAsync,
    isRemoving: removeMemberMutation.isPending
  };
}
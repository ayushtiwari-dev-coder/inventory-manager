// LOCATION: frontend_react\src\queries\salesMutations.js

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '../services/salesApi';
import { QUERY_KEYS } from './queryKeys';

export function useSalesMutations() {
  const queryClient = useQueryClient();

  const recordSaleMutation = useMutation({
    mutationFn: (itemsPayload) => salesApi.recordSale(itemsPayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SALES.RECENT });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LOGS.ALL }); // Trigger logs refresh
    },
  });

  return {
    recordSale: recordSaleMutation.mutateAsync,
    isCheckingOut: recordSaleMutation.isPending,
  };
}
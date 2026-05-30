// LOCATION: frontend_react\src\queries\salesMutations.js

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '../services/salesApi';
import { QUERY_KEYS } from './queryKeys';

export function useSalesMutations() {
  const queryClient = useQueryClient();

  const recordSaleMutation = useMutation({
    mutationFn: (itemsPayload) => salesApi.recordSale(itemsPayload),
    onSuccess: () => {
      // Invalidate everything globally because sales alter stock levels, transaction histories, and revenues
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  return {
    recordSale: recordSaleMutation.mutateAsync,
    isCheckingOut: recordSaleMutation.isPending,
  };
}
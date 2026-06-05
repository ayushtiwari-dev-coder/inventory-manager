// LOCATION: frontend_react\src\queries\productMutations.js

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../services/productApi';
import { QUERY_KEYS } from './queryKeys';

export function useProductMutations() {
  const queryClient = useQueryClient();

  const addProductMutation = useMutation({
    mutationFn: (payload) => productApi.addProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LOGS.ALL }); // Trigger logs refresh
    },
  });

  const editProductMutation = useMutation({
    mutationFn: (payload) => productApi.editProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LOGS.ALL }); // Trigger logs refresh
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId) => productApi.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LOGS.ALL }); // Trigger logs refresh
    },
  });

  return {
    addProduct: addProductMutation.mutateAsync,
    isAdding: addProductMutation.isPending,
    editProduct: editProductMutation.mutateAsync,
    isEditing: editProductMutation.isPending,
    deleteProduct: deleteProductMutation.mutateAsync,
  };
}
// LOCATION: frontend_react\src\queries\productMutations.js

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../services/productApi';
import { QUERY_KEYS } from './queryKeys';

export function useProductMutations() {
  const queryClient = useQueryClient();

  // 1. ADD PRODUCT MUTATION
  const addProductMutation = useMutation({
    mutationFn: (payload) => productApi.addProduct(payload),
    onSuccess: () => {
      // Per your rules: ONLY products are affected here. Sales & Analytics are untouched.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
    },
  });

  // 2. EDIT PRODUCT MUTATION
  const editProductMutation = useMutation({
    mutationFn: (payload) => productApi.editProduct(payload),
    onSuccess: () => {
      // Price adjustments or stock corrections change the catalog baseline only.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
    },
  });

  // 3. DELETE PRODUCT MUTATION
  const deleteProductMutation = useMutation({
    mutationFn: (productId) => productApi.deleteProduct(productId),
    onSuccess: () => {
      // Invalidate products so it's removed from active transaction view
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
      
      // Rule: Top/Least profitable tables can change if a ranked item gets deleted!
      queryClient.invalidateQueries({ queryKey: ['analytics'] }); 
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
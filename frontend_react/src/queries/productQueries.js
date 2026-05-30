import { useQuery } from '@tanstack/react-query';
import { productApi } from '../services/productApi';
import { QUERY_KEYS } from './queryKeys';

export function useProducts() {
    return useQuery({
        queryKey: QUERY_KEYS.PRODUCTS,
        queryFn: productApi.getProducts
    });
}
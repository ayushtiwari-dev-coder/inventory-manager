// LOCATION: frontend_react\src\queries\analyticsQueries.js

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/analyticsApi';
import { QUERY_KEYS } from './queryKeys';

// Hook for tracking rolling timeframe trends (depends dynamically on switcher months state)
export function useSalesTrend(months) {
  return useQuery({
    queryKey: QUERY_KEYS.ANALYTICS.TREND(months),
    queryFn: async () => {
      const res = await analyticsApi.getSalesTrend(months);
      return res?.data || { dates: [], revenue: [], profit: [] }; // Standardized chart axis layout
    }
  });
}

// Hook for high velocity performance ranking leaderboard charts
export function useTopProfitable() {
  return useQuery({
    queryKey: QUERY_KEYS.ANALYTICS.TOP_PROFITABLE,
    queryFn: async () => {
      const res = await analyticsApi.getTopProfitableProducts();
      return Array.isArray(res?.data) ? res.data : [];
    }
  });
}

// Hook for low velocity inventory tables
export function useLeastSold() {
  return useQuery({
    queryKey: QUERY_KEYS.ANALYTICS.LEAST_SOLD,
    queryFn: async () => {
      const res = await analyticsApi.getLeastSoldProducts();
      return Array.isArray(res?.data) ? res.data : [];
    }
  });
}
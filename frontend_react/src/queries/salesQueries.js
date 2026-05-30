// LOCATION: frontend_react\src\queries\salesQueries.js

import { useQuery } from '@tanstack/react-query';
import { salesApi } from '../services/salesApi';
import { analyticsApi } from '../services/analyticsApi';
import { QUERY_KEYS } from './queryKeys';

// Hook for recent transaction rows
export function useRecentSales() {
  return useQuery({
    queryKey: QUERY_KEYS.SALES.RECENT,
    queryFn: async () => {
      const res = await salesApi.getRecentSales();
      return res?.sales || []; // Safely extracts array matching legacy layout payload
    }
  });
}

// Hook for metric summary boxes (depends dynamically on current selected tab timeframe)
export function useRevenueSummary(timeframe) {
  return useQuery({
    queryKey: QUERY_KEYS.ANALYTICS.SUMMARY(timeframe),
    queryFn: async () => {
      const res = await analyticsApi.getRevenueSummary(timeframe);
      return res?.data || { total_transactions: 0, total_revenue: 0, total_profit: 0 };
    }
  });
}
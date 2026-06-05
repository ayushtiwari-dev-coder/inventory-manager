// LOCATION: frontend_react\src\queries\useLogsQuery.js

import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs } from '../services/logsService';
import { QUERY_KEYS } from './queryKeys';

export const useLogsQuery = (limit = 100) => {
  return useQuery({
    queryKey: QUERY_KEYS.LOGS.LIMIT(limit),
    queryFn: () => fetchAuditLogs(limit),
    staleTime: Infinity, 
    gcTime: 1000 * 60 * 60, 
  });
};
// LOCATION: frontend_react/src/queries/queryKeys.js
// Add EMPLOYEES to your exported QUERY_KEYS object:

export const QUERY_KEYS = {
  PRODUCTS: ['products'],
  SALES: {
    RECENT: ['sales', 'recent'],
  },
  ANALYTICS: {
    SUMMARY: (timeframe) => ['analytics', 'summary', timeframe],
    TOP_PROFITABLE: ['analytics', 'top-profitable'],
    LEAST_SOLD: ['analytics', 'least-sold'],
    TREND: (months) => ['analytics', 'trend', months],
  },
  LOGS: {
    ALL: ['audit_logs'],
    LIMIT: (limit) => ['audit_logs', limit]
  },
  EMPLOYEES: ['employees'] // <-- Add this
};
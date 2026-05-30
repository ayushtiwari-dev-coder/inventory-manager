// LOCATION: frontend_react\src\queries\queryKeys.js

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
  }
};
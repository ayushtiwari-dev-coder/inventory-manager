import apiClient from "./apiClient";

// frontend_react\src\services\analyticsApi.js

export const analyticsApi = {
    // Existing summary and bar endpoints [61]
    getRevenueSummary: (period) =>
        apiClient(`/analytics/revenue?period=${period}`, { method: 'GET', requireAuth: true }),
    getTopProfitableProducts: () =>
        apiClient('/analytics/top-profitable', { method: 'GET', requireAuth: true }),
    getLeastSoldProducts: () =>
        apiClient('/analytics/least-sold', { method: 'GET', requireAuth: true }),
        
    // Expose timeline metrics (months defaults to 4)
    getSalesTrend: (months = 4) =>
        apiClient(`/analytics/trend?months=${months}`, { method: 'GET', requireAuth: true })
};
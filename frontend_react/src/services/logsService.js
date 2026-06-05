// LOCATION: frontend_react\src\services\logsService.js

import apiClient from './apiClient';

export const fetchAuditLogs = async (limit = 100) => {
    // Rely on apiClient to automatically attach the Bearer token and handle errors
    const result = await apiClient(`/api/logs?limit=${limit}`, { method: 'GET', requireAuth: true });
    return result.data || [];
};
// src/services/salesApi.js
import apiClient from './apiClient';

export const salesApi = {
  recordSale: (items) => 
    apiClient('/sales', { method: 'POST', data: { items }, requireAuth: true }),

  getRecentSales: () => 
    apiClient('/sales/recent', { method: 'GET', requireAuth: true })
};
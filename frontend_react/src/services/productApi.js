import apiClient from './apiClient';

export const productApi = {
  getProducts: () => 
    apiClient('/products', { method: 'GET', requireAuth: true }),
    
  addProduct: (payload) => 
    apiClient('/products', { method: 'POST', data: payload, requireAuth: true }),
    
  editProduct: (payload) => 
    apiClient('/products/update', { method: 'PUT', data: payload, requireAuth: true }),
    
  deleteProduct: (productId) => 
    apiClient(`/products/${productId}`, { method: 'DELETE', requireAuth: true })
};
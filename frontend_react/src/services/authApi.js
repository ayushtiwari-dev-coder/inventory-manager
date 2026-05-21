import apiClient from './apiClient';

export const authApi = {
  login: (username, password) => 
    apiClient('/login', { method: 'POST', data: { username, password }, requireAuth: false }),
    
  register: (name, username, password, masterCode) => 
    apiClient('/register', { method: 'POST', data: { username, password, name, master_code: masterCode }, requireAuth: false })
};
// ============================================
// src/api/services/authService.js
// ============================================
import api from '../axiosConfig';
import { API_ENDPOINTS } from '../endpoints';

export const authService = {
  login: async (credentials) => {
    const response = await api.post(API_ENDPOINTS.LOGIN, credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post(API_ENDPOINTS.REGISTER, userData);
    return response.data;
  },

  logout: async () => {
    const response = await api.post(API_ENDPOINTS.LOGOUT);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get(API_ENDPOINTS.PROFILE);
    return response.data;
  },

  updateProfile: async (data) => {
    const formData = new FormData();
    
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });

    const response = await api.post(API_ENDPOINTS.UPDATE_PROFILE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post(API_ENDPOINTS.REFRESH);
    return response.data;
  },
};
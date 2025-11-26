// src/api/axiosConfig.js
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 seconds
  withCredentials: true, // Important for sending cookies
});

export const getCsrfToken = async () => {
  // Kita harus menghapus '/api' dari URL dasar khusus untuk request ini
  // Agar request mengarah ke http://localhost:8000/sanctum/csrf-cookie
  const rootUrl = API_BASE_URL.replace('/api', ''); 

  await axiosInstance.get('/sanctum/csrf-cookie', {
    baseURL: rootUrl,       // Override Base URL agar tidak ada prefix /api
    withCredentials: true,  // Wajib true agar cookie tersimpan di browser
  });
};

// ... (kode interceptors dan export default biarkan saja)

// Request interceptor - Add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // For CBT, add session token if exists
    const cbtSessionToken = sessionStorage.getItem('cbt_session_token');
    if (cbtSessionToken && config.url?.includes('/cbt/')) {
      config.headers['X-CBT-Session-Token'] = cbtSessionToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;

    if (response) {
      switch (response.status) {
        case 401:
          // Unauthorized - logout user
          useAuthStore.getState().logout();
          toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
          window.location.href = '/login';
          break;
        
        case 403:
          toast.error('Anda tidak memiliki akses ke resource ini.');
          break;
        
        case 404:
          toast.error('Resource tidak ditemukan.');
          break;
        
        case 422:
          // Validation errors
          const errors = response.data.errors;
          if (errors) {
            Object.values(errors).forEach((errorArray) => {
              errorArray.forEach((msg) => toast.error(msg));
            });
          }
          break;
        
        case 500:
          toast.error('Terjadi kesalahan pada server. Silakan coba lagi.');
          break;
        
        default:
          toast.error(response.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
      }
    } else if (error.request) {
      // Network error
      toast.error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } else {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
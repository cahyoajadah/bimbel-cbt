// src/api/services/studentService.js
import api from '../axiosConfig';

export const studentService = {
  // ... method lain ...

  // Method untuk mengambil jadwal kelas
  getClasses: async (params) => {
    const response = await api.get('/student/classes', { params });
    return response.data;
  },
  
  // Join class (untuk mencatat kehadiran & dapat link)
  joinClass: async (id) => {
    const response = await api.post(`/student/classes/${id}/join`);
    return response.data;
  }
};
// src/api/services/studentService.js
import api from '../axiosConfig';

export const studentService = {
  // --- EXISTING METHODS ---
  getClasses: async (params) => {
    const response = await api.get('/student/classes', { params });
    return response.data;
  },
  
  joinClass: async (id) => {
    const response = await api.post(`/student/classes/${id}/join`);
    return response.data;
  },

  // --- CBT METHODS (FIXED ROUTES) ---
  
  // [FIX] URL disesuaikan dengan api.php: /student/tryouts/{packageId}/start
  startTryoutSession: async (packageId) => {
    // Pastikan packageId ada
    if (!packageId) throw new Error("ID Paket tidak valid");
    const response = await api.post(`/student/tryouts/${packageId}/start`);
    return response.data;
  },

  getTryoutQuestions: async (token) => {
    const response = await api.get('/student/cbt/questions', {
        headers: { 'X-CBT-Session-Token': token }
    });
    return response.data;
  },

  saveAnswer: async (token, data) => {
    const response = await api.post('/student/cbt/save-answer', data, {
        headers: { 'X-CBT-Session-Token': token }
    });
    return response.data;
  },

  submitTryout: async (token) => {
    const response = await api.post('/student/cbt/submit', {}, {
        headers: { 'X-CBT-Session-Token': token }
    });
    return response.data;
  }
};
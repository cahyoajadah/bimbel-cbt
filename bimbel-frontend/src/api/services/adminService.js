// ============================================
// src/api/services/adminService.js
// ============================================
import api from '../axiosConfig';
import { API_ENDPOINTS } from '../endpoints';

export const adminService = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get(API_ENDPOINTS.ADMIN_DASHBOARD);
    return response.data;
  },

  // Packages
  getPackages: async (params) => {
    const response = await api.get(API_ENDPOINTS.PACKAGES, { params });
    return response.data;
  },

  createPackage: async (data) => {
    const response = await api.post(API_ENDPOINTS.PACKAGES, data);
    return response.data;
  },

  updatePackage: async (id, data) => {
    const response = await api.put(`${API_ENDPOINTS.PACKAGES}/${id}`, data);
    return response.data;
  },

  deletePackage: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.PACKAGES}/${id}`);
    return response.data;
  },

  assignPackageToStudents: async (id, data) => {
    const response = await api.post(API_ENDPOINTS.PACKAGE_ASSIGN(id), data);
    return response.data;
  },

  // Materials
  getMaterials: async (params) => {
    const response = await api.get(API_ENDPOINTS.MATERIALS, { params });
    return response.data;
  },

  createMaterial: async (data) => {
    let payload;
    
    if (data instanceof FormData) {
        payload = data;
    } else {
        const formData = new FormData();
        Object.keys(data).forEach((key) => {
            if (data[key] !== null && data[key] !== undefined) {
                 formData.append(key, data[key]);
            }
        });
        payload = formData;
    }

    const response = await api.post(API_ENDPOINTS.MATERIALS, payload, {
      headers: {
        // PERBAIKAN UTAMA: Set ke undefined agar browser otomatis
        // menambahkan boundary (multipart/form-data; boundary=----WebKitFormBoundary...)
        'Content-Type': undefined, 
      },
    });
    return response.data;
  },

  updateMaterial: async (id, data) => {
    let payload;
    if (data instanceof FormData) {
        payload = data;
    } else {
        const formData = new FormData();
        Object.keys(data).forEach((key) => {
            if (data[key] !== null && data[key] !== undefined) {
                 formData.append(key, data[key]);
            }
        });
        payload = formData;
    }

    // Gunakan POST untuk update file (Laravel method spoofing)
    const response = await api.post(`${API_ENDPOINTS.MATERIALS}/${id}`, payload, {
      headers: {
        'Content-Type': undefined, // PERBAIKAN UTAMA
      },
    });
    return response.data;
  },

  deleteMaterial: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.MATERIALS}/${id}`);
    return response.data;
  },

  // Students
  getStudents: async (params) => {
    const response = await api.get(API_ENDPOINTS.STUDENTS, { params });
    return response.data;
  },

  createStudent: async (data) => {
    const response = await api.post(API_ENDPOINTS.STUDENTS, data);
    return response.data;
  },

  updateStudent: async (id, data) => {
    const response = await api.put(`${API_ENDPOINTS.STUDENTS}/${id}`, data);
    return response.data;
  },

  deleteStudent: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.STUDENTS}/${id}`);
    return response.data;
  },

  // Schedules
  getSchedules: async (params) => {
    const response = await api.get(API_ENDPOINTS.SCHEDULES, { params });
    return response.data;
  },

  createSchedule: async (data) => {
    const response = await api.post(API_ENDPOINTS.SCHEDULES, data);
    return response.data;
  },

  updateSchedule: async (id, data) => {
    const response = await api.put(`${API_ENDPOINTS.SCHEDULES}/${id}`, data);
    return response.data;
  },

  deleteSchedule: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.SCHEDULES}/${id}`);
    return response.data;
  },

  // Teachers
  getTeachers: async (params) => {
    const response = await api.get(API_ENDPOINTS.TEACHERS, { params });
    return response.data;
  },

  createTeacher: async (data) => {
    const response = await api.post(API_ENDPOINTS.TEACHERS, data);
    return response.data;
  },

  updateTeacher: async (id, data) => {
    const response = await api.put(`${API_ENDPOINTS.TEACHERS}/${id}`, data);
    return response.data;
  },

  deleteTeacher: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.TEACHERS}/${id}`);
    return response.data;
  },

  // Feedbacks
  getFeedbacks: async (params) => {
    const response = await api.get(API_ENDPOINTS.FEEDBACKS, { params });
    return response.data;
  },

  createFeedback: async (data) => {
    const response = await api.post(API_ENDPOINTS.FEEDBACKS, data);
    return response.data;
  },

  updateFeedback: async (id, data) => {
    const response = await api.put(`${API_ENDPOINTS.FEEDBACKS}/${id}`, data);
    return response.data;
  },

  deleteFeedback: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.FEEDBACKS}/${id}`);
    return response.data;
  },

  // Subjects Management
  getSubjects: async (params) => {
    const response = await api.get('/admin/subjects', { params });
    return response.data;
  },

  createSubject: async (data) => {
    const response = await api.post('/admin/subjects', data);
    return response.data;
  },

  updateSubject: async (id, data) => {
    const response = await api.put(`/admin/subjects/${id}`, data);
    return response.data;
  },

  deleteSubject: async (id) => {
    const response = await api.delete(`/admin/subjects/${id}`);
    return response.data;
  },
  
  // Programs (Pastikan endpoint ini ada di backend Anda, atau buat ProgramController sederhana)
  getPrograms: async () => {
    const response = await api.get('/admin/programs'); 
    return response.data;
  },
  getPublicPrograms: async () => {
    // Mengambil dari route '/api/programs' yang bebas akses (asal login)
    const response = await api.get('/programs'); 
    return response.data;
  },
};
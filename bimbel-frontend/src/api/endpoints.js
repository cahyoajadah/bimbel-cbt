// ============================================
// src/api/endpoints.js
// ============================================
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  PROFILE: '/auth/profile',
  UPDATE_PROFILE: '/auth/profile',
  REFRESH: '/auth/refresh',

  // Public
  PROGRAMS: '/public/programs',
  TESTIMONIES: '/public/testimonies',
  FEATURES: '/public/features',
  FAQ: '/public/faq',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  PACKAGES: '/admin/packages',
  PACKAGE_ASSIGN: (id) => `/admin/packages/${id}/assign-students`,
  MATERIALS: '/admin/materials',
  MATERIAL_ASSIGN: (id) => `/admin/materials/${id}/assign-students`,
  SCHEDULES: '/admin/schedules',
  TEACHERS: '/admin/teachers',
  STUDENTS: '/admin/students',
  STUDENT_PROGRAMS: (id) => `/admin/students/${id}/programs`,
  STUDENT_ATTENDANCE: (id) => `/admin/students/${id}/attendance`,
  FEEDBACKS: '/admin/feedbacks',
  ADMIN_ANNOUNCEMENTS: '/admin/announcements',
  ADMIN_SEND_CREDENTIALS: (id) => `/admin/students/${id}/send-credentials`,

  // Question Maker
  QUESTION_PACKAGES: '/question-maker/packages',
  QUESTIONS: (packageId) => `/question-maker/packages/${packageId}/questions`,
  QUESTION_DETAIL: (packageId, questionId) => 
    `/question-maker/packages/${packageId}/questions/${questionId}`,
  QUESTION_REPORTS: '/question-maker/reports',
  REPORT_RESPOND: (id) => `/question-maker/reports/${id}/respond`,

  // Student
  STUDENT_DASHBOARD: '/student/dashboard',
  SUBJECTS: '/student/subjects',
  SUBJECT_MATERIALS: (id) => `/student/subjects/${id}/materials`,
  MATERIAL_COMPLETE: (id) => `/student/materials/${id}/complete`,
  CLASSES: '/student/classes',
  CLASSES_UPCOMING: '/student/classes/upcoming',
  CLASS_JOIN: (id) => `/student/classes/${id}/join`,
  STUDENT_SCHEDULES: '/student/schedules',
  PROGRESS: '/student/progress',
  STUDENT_FEEDBACKS: '/student/feedbacks',
  STUDENT_ANNOUNCEMENTS: '/student/announcements',
  STUDENT_ANNOUNCEMENTS_RECENT: '/student/announcements/recent',
  ANNOUNCEMENT_READ: (id) => `/student/announcements/${id}/read`,
  
  // CBT
  TRYOUTS: '/student/tryouts',
  TRYOUT_START: (packageId) => `/student/tryouts/${packageId}/start`,
  TRYOUT_REVIEW: (resultId) => `/student/tryout-results/${resultId}/review`,
  REPORT_QUESTION: '/student/questions/report',
  
  // CBT Session (requires session token)
  CBT_QUESTIONS: '/cbt/questions',
  CBT_ANSWER: '/cbt/answer',
  CBT_SUBMIT: '/cbt/submit',
  CBT_FULLSCREEN_WARNING: '/cbt/fullscreen-warning',
};
// ============================================
// src/utils/constants.js
// ============================================
export const ROLES = {
  ADMIN: 'admin_manajemen',
  QUESTION_MAKER: 'pembuat_soal',
  STUDENT: 'siswa',
};

export const ROLE_NAMES = {
  [ROLES.ADMIN]: 'Admin Manajemen',
  [ROLES.QUESTION_MAKER]: 'Admin Pembuat Soal',
  [ROLES.STUDENT]: 'Siswa',
};

export const MATERIAL_TYPES = {
  VIDEO: 'video',
  PDF: 'pdf',
};

export const SCHEDULE_TYPES = {
  TRYOUT: 'tryout',
  CLASS: 'class',
};

export const CLASS_TYPES = {
  ZOOM: 'zoom',
  OFFLINE: 'offline',
};

export const ATTENDANCE_STATUS = {
  HADIR: 'hadir',
  IZIN: 'izin',
  SAKIT: 'sakit',
  ALPHA: 'alpha',
};

export const CBT_STATUS = {
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  AUTO_SUBMIT: 'auto_submit',
};

export const QUESTION_REPORT_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  RESOLVED: 'resolved',
};
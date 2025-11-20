// ============================================
// src/routes/RoleBasedRoute.jsx
// ============================================
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardMap = {
      'admin_manajemen': '/admin/dashboard',
      'pembuat_soal': '/question-maker/dashboard',
      'siswa': '/student/dashboard',
    };
    
    return <Navigate to={dashboardMap[user?.role] || '/'} replace />;
  }

  return children;
};

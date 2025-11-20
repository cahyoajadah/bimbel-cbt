// ============================================
// src/routes/AppRoutes.jsx
// ============================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Pages
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard'; // to be created
import AdminPackages from '../pages/admin/Packages';
import AdminMaterials from '../pages/admin/Materials'; // to be created
import AdminSchedules from '../pages/admin/Schedules'; // to be created
import AdminTeachers from '../pages/admin/Teachers'; // to be created
import AdminStudents from '../pages/admin/Students'; // to be created
import AdminFeedbacks from '../pages/admin/Feedbacks'; // to be created

// Question Maker Pages 
import QuestionMakerDashboard from '../pages/questionMaker/Dashboard'; // to be created
import QuestionPackages from '../pages/questionMaker/QuestionPackages'; // to be created
import Questions from '../pages/questionMaker/Questions'; // to be created
import QuestionReports from '../pages/questionMaker/Reports'; // to be created

// Student Pages  
import StudentDashboard from '../pages/student/Dashboard'; // to be created
import Subjects from '../pages/student/Subjects'; // to be created
import SubjectMaterials from '../pages/student/SubjectMaterials'; // to be created
import Classes from '../pages/student/Classes'; // to be created
import Tryouts from '../pages/student/Tryouts'; // to be created
import CBT from '../pages/student/CBT'; 
import TryoutReview from '../pages/student/TryoutReview'; // to be created
import Schedules from '../pages/student/Schedules'; // to be created
import Progress from '../pages/student/Progress'; // to be created
import Profile from '../pages/student/Profile'; // to be created

// Layout
import DashboardLayout from '../components/layout/DashboardLayout';

// Route Components
import { ProtectedRoute } from './ProtectedRoute';
import { RoleBasedRoute } from './RoleBasedRoute';

function AppRoutes() {
  const { isAuthenticated, user } = useAuthStore();

  // Redirect authenticated users from landing/login
  const handleAuthRedirect = () => {
    if (!isAuthenticated) return null;

    const roleRedirects = {
      'admin_manajemen': '/admin/dashboard',
      'pembuat_soal': '/question-maker/dashboard',
      'siswa': '/student/dashboard',
    };

    return <Navigate to={roleRedirects[user?.role] || '/'} replace />;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={isAuthenticated ? handleAuthRedirect() : <Landing />} />
        <Route path="/login" element={isAuthenticated ? handleAuthRedirect() : <Login />} />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={['admin_manajemen']}>
                <DashboardLayout role="admin">
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="packages" element={<AdminPackages />} />
                    <Route path="materials" element={<AdminMaterials />} />
                    <Route path="schedules" element={<AdminSchedules />} />
                    <Route path="teachers" element={<AdminTeachers />} />
                    <Route path="students" element={<AdminStudents />} />
                    <Route path="feedbacks" element={<AdminFeedbacks />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />

        {/* Question Maker Routes */}
        <Route
          path="/question-maker/*"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={['pembuat_soal']}>
                <DashboardLayout role="question-maker">
                  <Routes>
                    <Route path="dashboard" element={<QuestionMakerDashboard />} />
                    <Route path="packages" element={<QuestionPackages />} />
                    <Route path="packages/:packageId/questions" element={<Questions />} />
                    <Route path="reports" element={<QuestionReports />} />
                    <Route path="*" element={<Navigate to="/question-maker/dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={['siswa']}>
                <DashboardLayout role="student">
                  <Routes>
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="subjects" element={<Subjects />} />
                    <Route path="subjects/:subjectId/materials" element={<SubjectMaterials />} />
                    <Route path="classes" element={<Classes />} />
                    <Route path="tryouts" element={<Tryouts />} />
                    <Route path="schedules" element={<Schedules />} />
                    <Route path="progress" element={<Progress />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />

        {/* CBT Route (Full screen, no layout) */}
        <Route
          path="/student/cbt/:sessionId"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={['siswa']}>
                <CBT />
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />

        {/* Tryout Review */}
        <Route
          path="/student/tryout-review/:resultId"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={['siswa']}>
                <DashboardLayout role="student">
                  <TryoutReview />
                </DashboardLayout>
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
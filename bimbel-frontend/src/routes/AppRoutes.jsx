// ============================================
// src/routes/AppRoutes.jsx
// ============================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Pages
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import Gallery from '../pages/Gallery'; 
import Blog from '../pages/Blog';       

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import AdminPrograms from '../pages/admin/Programs';
import AdminSubjects from '../pages/admin/Subjects';
import AdminMaterials from '../pages/admin/Materials';
import AdminSchedules from '../pages/admin/Schedules';
import AdminAnnouncements from '../pages/admin/Announcements';
import AdminTeachers from '../pages/admin/Teachers';
import AdminStudents from '../pages/admin/Students';
import AdminMonitoring from '../pages/admin/Monitoring';
import AdminProfile from '../pages/admin/Profile';

// Question Maker Pages 
import QuestionMakerDashboard from '../pages/questionMaker/Dashboard';
import QuestionPackages from '../pages/questionMaker/QuestionPackages';
import Questions from '../pages/questionMaker/Questions';
import QuestionReports from '../pages/questionMaker/Reports';
import QuestionMakerProfile from '../pages/questionMaker/Profile';

// Student Pages  
import StudentDashboard from '../pages/student/Dashboard';
import Subjects from '../pages/student/Subjects';
import SubjectMaterials from '../pages/student/SubjectMaterials';
import Classes from '../pages/student/Classes';
import Tryouts from '../pages/student/Tryouts';
import CBT from '../pages/student/CBT'; 
import TryoutReview from '../pages/student/TryoutReview';
import Schedules from '../pages/student/Schedules';
import Progress from '../pages/student/Progress';
import Profile from '../pages/student/Profile';
import StudentFeedbacks from '../pages/student/Feedbacks';
import StudentAnnouncements from '../pages/student/Announcements';
import Rankings from '../pages/student/Rankings'; // [FIX] Import Rankings ditambahkan di sini

import DashboardLayout from '../components/layout/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleBasedRoute } from './RoleBasedRoute';

import BlogDetail from '../pages/BlogDetail'; 
import ContentManager from '../pages/admin/ContentManager';

function AppRoutes() {
  const { isAuthenticated, user } = useAuthStore();

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
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={isAuthenticated ? handleAuthRedirect() : <Landing />} />
        <Route path="/login" element={isAuthenticated ? handleAuthRedirect() : <Login />} />
        
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        
        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={['admin_manajemen']}>
                <DashboardLayout role="admin">
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="programs-manage" element={<AdminPrograms />} />
                    <Route path="subjects" element={<AdminSubjects />} />
                    <Route path="materials" element={<AdminMaterials />} />
                    <Route path="schedules" element={<AdminSchedules />} />
                    <Route path="announcements" element={<AdminAnnouncements />} />
                    <Route path="teachers" element={<AdminTeachers />} />
                    <Route path="students" element={<AdminStudents />} />
                    <Route path="monitoring" element={<AdminMonitoring />} /> 
                    <Route path="content-manager" element={<ContentManager />} />
                    <Route path="profile" element={<AdminProfile />} />
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
                    <Route path="profile" element={<QuestionMakerProfile />} />
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
                    <Route path="feedbacks" element={<StudentFeedbacks />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="announcements" element={<StudentAnnouncements />} />
                    
                    {/* Halaman Rangking */}
                    <Route path="rankings" element={<Rankings />} />
                    
                    <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />

        {/* CBT Route */}
        <Route
          path="/student/cbt"
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

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
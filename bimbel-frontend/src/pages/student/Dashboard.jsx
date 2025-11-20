// ============================================
// src/pages/student/Dashboard.jsx
// ============================================
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, FileText, TrendingUp, ArrowRight, Video, Award 
} from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDateTime } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';
import clsx from 'clsx';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const student = user?.student;

  const { data, isLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.STUDENT_DASHBOARD);
      return res.data.data;
    },
  });

  const dashboardData = data || {};

  const statsCards = [
    {
      title: 'Skor Tryout Terakhir',
      value: student?.last_tryout_score || 0,
      icon: Award,
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      path: '/student/progress'
    },
    {
      title: 'Materi Selesai',
      value: dashboardData.learning_progress?.completed_materials || 0,
      total: dashboardData.learning_progress?.total_materials || 0,
      icon: BookOpen,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      path: '/student/progress'
    },
  ];

  if (isLoading) {
    return <LoadingSpinner text="Memuat dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Halo, {user?.name}!</h1>
        <p className="mt-1 text-sm text-gray-600">
          Selamat datang di portal pembelajaran Anda.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(stat.path)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                    {stat.total > 0 && <span className="text-xl font-normal text-gray-500">/{stat.total}</span>}
                  </p>
                </div>
                <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', stat.bgColor)}>
                  <Icon className={clsx('w-6 h-6', stat.textColor)} />
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Quick Link: Tryout */}
        <div 
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-blue-600"
          onClick={() => navigate('/student/tryouts')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mulai Tryout</p>
              <p className="text-xl font-bold text-blue-600 mt-2 flex items-center">
                Kerjakan Soal
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Quick Link: Progress */}
        <div 
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-green-600"
          onClick={() => navigate('/student/progress')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Progres Belajar</p>
              <p className="text-xl font-bold text-green-600 mt-2 flex items-center">
                Analisis Belajar
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Latest Materials & Upcoming Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Latest Materials */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Materi Terbaru</h2>
            <Link to="/student/subjects" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
              Lihat Semua <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {dashboardData.latest_materials?.length > 0 ? (
              dashboardData.latest_materials.map((material) => (
                <Link
                  key={material.id}
                  // Assuming subject_id is available in the material data
                  to={`/student/subjects/${material.subject_id}/materials`} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <p className="text-sm font-medium text-gray-700 line-clamp-1">
                      {material.title}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0 capitalize">{material.type}</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500">Tidak ada materi terbaru.</p>
            )}
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Kelas Mendatang</h2>
            <Link to="/student/classes" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
              Lihat Semua <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {dashboardData.latest_classes?.length > 0 ? (
              dashboardData.latest_classes.map((classItem) => (
                <Link
                  key={classItem.id}
                  to="/student/classes"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Video className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-gray-700 line-clamp-1">{classItem.title}</p>
                        <p className="text-xs text-gray-500">{classItem.program?.name || 'Kelas'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatDateTime(classItem.start_time)}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500">Tidak ada kelas mendatang.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}